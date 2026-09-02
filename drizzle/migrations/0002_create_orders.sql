-- الطلبات: رأس الطلب + بنوده + حالته، مع الدفع من المحفظة.

CREATE TYPE public.order_status AS ENUM (
  'pending',    -- قيد التنفيذ
  'confirmed',  -- تم التأكيد
  'shipped',    -- تم الشحن
  'completed',  -- مكتمل
  'cancelled'   -- ملغي
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  full_name text NOT NULL,
  phone text NOT NULL,
  fulfilment text NOT NULL CHECK (fulfilment IN ('delivery', 'pickup')),
  governorate text,
  address text,
  branch text,
  payment_method text NOT NULL CHECK (payment_method IN ('instapay', 'bank', 'wallet', 'cash')),
  subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee numeric(14,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total numeric(14,2) NOT NULL CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  qty integer NOT NULL CHECK (qty > 0 AND qty <= 99),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price > 0),
  weight_g numeric(10,3) NOT NULL DEFAULT 0
);

CREATE INDEX orders_user_created_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX order_items_order_idx ON public.order_items (order_id);

-- القراءة فقط للعميل؛ الإنشاء والإلغاء عبر الدوال أدناه.
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
ON public.orders FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can read own order items"
ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()
));

-- الدفع من المحفظة يُسجَّل في نفس دفتر حركات المحفظة.
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_kind_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_kind_check
  CHECK (kind IN ('deposit', 'withdraw', 'buy_gold', 'sell_gold', 'order_payment', 'order_refund'));

-- رسوم التوصيل: تُطبَّق على السيرفر حتى لا يحددها العميل.
CREATE OR REPLACE FUNCTION public.delivery_fee_for(p_fulfilment text, p_subtotal numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_fulfilment = 'pickup' THEN 0
    WHEN p_subtotal >= 50000 THEN 0
    ELSE 150
  END::numeric;
$$;

-- إنشاء طلب: يعيد حساب الإجماليات من البنود، ويخصم من المحفظة عند الدفع بالرصيد.
--
-- ملاحظة: unit_price يأتي من العميل (السعر اللحظي الذي شاهده) ويُتحقق من كونه موجبًا فقط.
-- قبل تشغيل أموال حقيقية، سعّر البنود على السيرفر من مصدر أسعار موثوق.
CREATE OR REPLACE FUNCTION public.place_order(
  p_full_name text,
  p_phone text,
  p_fulfilment text,
  p_payment_method text,
  p_items jsonb,
  p_governorate text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_branch text DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_subtotal numeric(14,2);
  v_fee numeric(14,2);
  v_total numeric(14,2);
  v_order public.orders;
  v_ref text;
  v_cash numeric(14,2);
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'order has no items' USING ERRCODE = 'ORD01';
  END IF;
  IF p_fulfilment = 'delivery' AND coalesce(btrim(p_address), '') = '' THEN
    RAISE EXCEPTION 'address required for delivery' USING ERRCODE = 'ORD02';
  END IF;

  SELECT sum((i->>'unit_price')::numeric * (i->>'qty')::int)
    INTO v_subtotal
    FROM jsonb_array_elements(p_items) AS i;

  IF v_subtotal IS NULL OR v_subtotal <= 0 THEN
    RAISE EXCEPTION 'invalid order total' USING ERRCODE = 'ORD03';
  END IF;

  v_fee := public.delivery_fee_for(p_fulfilment, v_subtotal);
  v_total := v_subtotal + v_fee;
  v_ref := 'ORA-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  INSERT INTO public.orders (
    ref, user_id, full_name, phone, fulfilment, governorate, address, branch,
    payment_method, subtotal, delivery_fee, total
  ) VALUES (
    v_ref, v_user, btrim(p_full_name), btrim(p_phone), p_fulfilment,
    p_governorate, p_address, p_branch, p_payment_method, v_subtotal, v_fee, v_total
  ) RETURNING * INTO v_order;

  INSERT INTO public.order_items (order_id, slug, title, qty, unit_price, weight_g)
  SELECT v_order.id, i->>'slug', i->>'title', (i->>'qty')::int,
         (i->>'unit_price')::numeric, coalesce((i->>'weight_g')::numeric, 0)
    FROM jsonb_array_elements(p_items) AS i;

  IF p_payment_method = 'wallet' THEN
    INSERT INTO public.wallets (user_id) VALUES (v_user) ON CONFLICT DO NOTHING;
    SELECT cash_balance INTO v_cash FROM public.wallets WHERE user_id = v_user FOR UPDATE;

    IF v_cash < v_total THEN
      RAISE EXCEPTION 'insufficient cash balance' USING ERRCODE = 'WLT01';
    END IF;

    UPDATE public.wallets
       SET cash_balance = cash_balance - v_total, updated_at = now()
     WHERE user_id = v_user;

    INSERT INTO public.wallet_transactions (user_id, kind, cash_delta)
    VALUES (v_user, 'order_payment', -v_total);

    UPDATE public.orders SET status = 'confirmed', updated_at = now()
     WHERE id = v_order.id RETURNING * INTO v_order;
  END IF;

  RETURN v_order;
END;
$$;

-- إلغاء طلب: مسموح لصاحبه فقط وما دام لم يُشحن، ويرد المدفوع من المحفظة.
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_order public.orders;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_order FROM public.orders
   WHERE id = p_order_id AND user_id = v_user FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found' USING ERRCODE = 'ORD04';
  END IF;
  IF v_order.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'order can no longer be cancelled' USING ERRCODE = 'ORD05';
  END IF;

  IF v_order.payment_method = 'wallet' THEN
    UPDATE public.wallets
       SET cash_balance = cash_balance + v_order.total, updated_at = now()
     WHERE user_id = v_user;

    INSERT INTO public.wallet_transactions (user_id, kind, cash_delta)
    VALUES (v_user, 'order_refund', v_order.total);
  END IF;

  UPDATE public.orders SET status = 'cancelled', updated_at = now()
   WHERE id = p_order_id RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(text, text, text, text, jsonb, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, text, jsonb, text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.cancel_order(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated;

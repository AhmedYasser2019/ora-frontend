-- محفظة العميل: رصيد نقدي بالجنيه + رصيد ذهب بالجرام، مع دفتر حركات.

CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_balance numeric(14,2) NOT NULL DEFAULT 0 CHECK (cash_balance >= 0),
  gold_grams numeric(12,3) NOT NULL DEFAULT 0 CHECK (gold_grams >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('deposit', 'withdraw', 'buy_gold', 'sell_gold')),
  cash_delta numeric(14,2) NOT NULL DEFAULT 0,
  grams_delta numeric(12,3) NOT NULL DEFAULT 0,
  gram_price numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX wallet_transactions_user_created_idx
  ON public.wallet_transactions (user_id, created_at DESC);

-- القراءة فقط للعميل؛ كل الكتابة تمر عبر wallet_transact.
GRANT SELECT ON public.wallets TO authenticated;
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.wallet_transactions TO service_role;

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet"
ON public.wallets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can read own wallet transactions"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- المدخل الوحيد لتغيير الأرصدة: يتحقق، يحرّك الرصيد، ويكتب سطر الدفتر في معاملة واحدة.
--
-- ملاحظة: p_gram_price يأتي من العميل (السعر اللحظي الذي شاهده) ويُتحقق منه هنا
-- تحققًا مبدئيًا فقط. قبل تشغيل أموال حقيقية، اقرأ السعر من مصدر موثوق على السيرفر.
CREATE OR REPLACE FUNCTION public.wallet_transact(
  p_kind text,
  p_amount numeric,          -- جنيه للإيداع/السحب، جرام للشراء/البيع
  p_gram_price numeric DEFAULT NULL
)
RETURNS public.wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cash numeric(14,2) := 0;
  v_grams numeric(12,3) := 0;
  v_wallet public.wallets;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive' USING ERRCODE = '22023';
  END IF;

  IF p_kind IN ('buy_gold', 'sell_gold') THEN
    IF p_gram_price IS NULL OR p_gram_price <= 0 THEN
      RAISE EXCEPTION 'gram price required' USING ERRCODE = '22023';
    END IF;
  ELSE
    p_gram_price := NULL;
  END IF;

  CASE p_kind
    WHEN 'deposit' THEN
      v_cash := p_amount;
    WHEN 'withdraw' THEN
      v_cash := -p_amount;
    WHEN 'buy_gold' THEN
      v_grams := p_amount;
      v_cash := -round(p_amount * p_gram_price, 2);
    WHEN 'sell_gold' THEN
      v_grams := -p_amount;
      v_cash := round(p_amount * p_gram_price, 2);
    ELSE
      RAISE EXCEPTION 'unknown kind %', p_kind USING ERRCODE = '22023';
  END CASE;

  INSERT INTO public.wallets (user_id) VALUES (v_user) ON CONFLICT DO NOTHING;
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user FOR UPDATE;

  IF v_wallet.cash_balance + v_cash < 0 THEN
    RAISE EXCEPTION 'insufficient cash balance' USING ERRCODE = 'WLT01';
  END IF;
  IF v_wallet.gold_grams + v_grams < 0 THEN
    RAISE EXCEPTION 'insufficient gold balance' USING ERRCODE = 'WLT02';
  END IF;

  UPDATE public.wallets
     SET cash_balance = cash_balance + v_cash,
         gold_grams = gold_grams + v_grams,
         updated_at = now()
   WHERE user_id = v_user
   RETURNING * INTO v_wallet;

  INSERT INTO public.wallet_transactions (user_id, kind, cash_delta, grams_delta, gram_price)
  VALUES (v_user, p_kind, v_cash, v_grams, p_gram_price);

  RETURN v_wallet;
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_transact(text, numeric, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.wallet_transact(text, numeric, numeric) TO authenticated;

-- افتح محفظة مع كل حساب جديد، وللحسابات الموجودة بالفعل.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

INSERT INTO public.wallets (user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;

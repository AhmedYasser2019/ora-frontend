-- حدود الإيداع والسحب المعلنة في سياسة الاسترجاع، مطبَّقة على السيرفر.
-- تستبدل wallet_transact من 0001 وتضيف التحقق من الحدود قبل تحريك الرصيد.

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
  v_withdrawn_today numeric(14,2);
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

  IF p_kind = 'deposit' AND p_amount < 100 THEN
    RAISE EXCEPTION 'deposit below minimum' USING ERRCODE = 'WLT03';
  END IF;

  IF p_kind = 'withdraw' THEN
    IF p_amount < 500 THEN
      RAISE EXCEPTION 'withdrawal below minimum' USING ERRCODE = 'WLT04';
    END IF;

    SELECT coalesce(sum(-cash_delta), 0) INTO v_withdrawn_today
      FROM public.wallet_transactions
     WHERE user_id = v_user
       AND kind = 'withdraw'
       AND created_at > now() - interval '24 hours';

    IF v_withdrawn_today + p_amount > 200000 THEN
      RAISE EXCEPTION 'daily withdrawal limit exceeded' USING ERRCODE = 'WLT05';
    END IF;
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

-- UPDATE create_case_and_debit to handle existing Tenants AND correct wallet ID selection

CREATE OR REPLACE FUNCTION public.create_case_and_debit(
  p_consultant_id uuid,
  p_tenant_name text,
  p_siret text,
  p_case_category text,
  p_audit_type text[],
  p_training_categories text[] 
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id uuid;
  v_balance int;
  v_cost int;
  v_tenant_id uuid;
  v_case_id uuid;
BEGIN
  -- 1. Check Wallet Balance
  -- CORRECTED: Select consultant_id as wallet_id (since consultant_id is the PK of credits_wallet)
  SELECT consultant_id, balance INTO v_wallet_id, v_balance
  FROM public.credits_wallet
  WHERE consultant_id = p_consultant_id;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for consultant';
  END IF;

  -- 2. Determine Cost
  IF p_case_category = 'mono-site' THEN
    v_cost := 1;
  ELSIF p_case_category = 'multi-site' THEN
    v_cost := 2;
  ELSE
    RAISE EXCEPTION 'Invalid case category';
  END IF;

  IF v_balance < v_cost THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- 3. Create or Get Tenant (Handle Duplicate SIRET)
  INSERT INTO public.tenants (name, siret, created_by)
  VALUES (p_tenant_name, p_siret, p_consultant_id)
  ON CONFLICT (siret) 
  DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_tenant_id;

  -- 4. Create Case
  INSERT INTO public.cases (tenant_id, category, status, audit_type, training_categories)
  VALUES (v_tenant_id, p_case_category, 'draft', p_audit_type, p_training_categories)
  RETURNING id INTO v_case_id;

  -- 5. Debit Wallet
  UPDATE public.credits_wallet
  SET balance = balance - v_cost,
      updated_at = now()
  WHERE consultant_id = p_consultant_id;

  -- 6. Log Transaction
  -- v_wallet_id is actually the consultant_id here, which serves as the wallet ID reference
  INSERT INTO public.transactions (wallet_id, amount, transaction_type, description)
  VALUES (v_wallet_id, -v_cost, 'usage', 'Creation dossier ' || p_case_category || ' pour ' || p_tenant_name);

  RETURN jsonb_build_object(
    'case_id', v_case_id,
    'tenant_id', v_tenant_id,
    'new_balance', v_balance - v_cost
  );
END;
$$;

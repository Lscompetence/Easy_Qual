-- Migration: Add client credentials to tenants for consultant view
-- 1. Add columns to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS initial_password text;

-- 2. Update the RPC function to handle these new fields
CREATE OR REPLACE FUNCTION public.create_case_and_debit(
  p_consultant_id uuid,
  p_tenant_name text,
  p_siret text,
  p_case_category text,
  p_audit_type text[],
  p_training_categories text[],
  p_client_email text, -- Nouveau
  p_initial_password text -- Nouveau
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cost int;
  v_wallet_balance int;
  v_tenant_id uuid;
  v_case_id uuid;
BEGIN
  -- 1. Déterminer le coût
  IF p_case_category = 'mono-site' THEN
    v_cost := 1;
  ELSIF p_case_category = 'multi-site' THEN
    v_cost := 2;
  ELSE
    RAISE EXCEPTION 'Catégorie invalide. Doit être mono-site ou multi-site';
  END IF;

  -- 2. Vérifier le solde
  SELECT balance INTO v_wallet_balance
  FROM public.credits_wallet
  WHERE consultant_id = p_consultant_id
  FOR UPDATE;

  IF v_wallet_balance IS NULL THEN
    RAISE EXCEPTION 'Portefeuille non trouvé';
  END IF;

  IF v_wallet_balance < v_cost THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  -- 3. Créer le Tenant (avec email et password)
  INSERT INTO public.tenants (name, siret, created_by, client_email, initial_password)
  VALUES (p_tenant_name, p_siret, p_consultant_id, p_client_email, p_initial_password)
  RETURNING id INTO v_tenant_id;

  -- 4. Créer le Dossier
  INSERT INTO public.cases (tenant_id, category, status, audit_type, training_categories)
  VALUES (v_tenant_id, p_case_category, 'draft', p_audit_type, p_training_categories)
  RETURNING id INTO v_case_id;

  -- 5. Débiter le portefeuille
  UPDATE public.credits_wallet
  SET balance = balance - v_cost,
      updated_at = now()
  WHERE consultant_id = p_consultant_id;

  -- 6. Log Transaction
  INSERT INTO public.transactions (wallet_id, amount, transaction_type, description)
  VALUES (p_consultant_id, -v_cost, 'usage', 'Creation dossier ' || p_case_category || ' pour ' || p_tenant_name);

  RETURN jsonb_build_object(
    'case_id', v_case_id, 
    'tenant_id', v_tenant_id, 
    'new_balance', v_wallet_balance - v_cost
  );
END;
$$;

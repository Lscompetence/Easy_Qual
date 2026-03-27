-- Migration to add extra validation to create_case_and_debit to prevent creating dossiers
-- when an email or siret already exists or when auth user exists.
CREATE OR REPLACE FUNCTION public.create_case_and_debit(
  p_consultant_id uuid,
  p_tenant_name text,
  p_siret text,
  p_case_category text,
  p_audit_type text[],
  p_training_categories text[],
  p_client_email text,
  p_initial_password text
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
  v_existing_auth_id uuid;
  v_existing_tenant_id uuid;
BEGIN
  -- 1. Validation de base
  IF p_client_email IS NULL OR p_client_email = '' THEN
    RAISE EXCEPTION 'Email du client obligatoire';
  END IF;

  -- 2. Vérifier si le SIRET est déjà utilisé dans tenants
  IF p_siret IS NOT NULL AND p_siret <> '' THEN
    SELECT id INTO v_existing_tenant_id FROM public.tenants WHERE siret = p_siret LIMIT 1;
    IF v_existing_tenant_id IS NOT NULL THEN
      RAISE EXCEPTION 'Ce numéro SIRET (% ) est déjà utilisé par un autre client.', p_siret;
    END IF;
  END IF;

  -- 3. Vérifier si l'email est déjà utilisé dans tenants (business isolation)
  SELECT id INTO v_existing_tenant_id FROM public.tenants WHERE lower(client_email) = lower(p_client_email) LIMIT 1;
  IF v_existing_tenant_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cet email (% ) est déjà associé à un dossier client dans l''application.', p_client_email;
  END IF;

  -- 4. Vérifier si l'utilisateur existe déjà dans Supabase Auth
  -- On utilise lower() pour l'email car Auth est insensible à la casse
  SELECT id INTO v_existing_auth_id
  FROM auth.users
  WHERE lower(email) = lower(p_client_email)
  LIMIT 1;

  IF v_existing_auth_id IS NOT NULL THEN
    RAISE EXCEPTION 'Un compte avec cet email (% ) existe déjà sur la plateforme (Auth). Impossible de créer un nouveau dossier avec cet email.', p_client_email;
  END IF;

  -- 5. Déterminer le coût
  IF p_case_category = 'mono-site' THEN
    v_cost := 1;
  ELSIF p_case_category = 'multi-site' THEN
    v_cost := 2;
  ELSE
    RAISE EXCEPTION 'Catégorie invalide. Doit être mono-site ou multi-site';
  END IF;

  -- 6. Vérifier le solde
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

  -- 7. Créer le Tenant (avec email et password)
  INSERT INTO public.tenants (name, siret, created_by, client_email, initial_password)
  VALUES (p_tenant_name, p_siret, p_consultant_id, p_client_email, p_initial_password)
  RETURNING id INTO v_tenant_id;

  -- 8. Créer le Dossier (Associer le consultant)
  INSERT INTO public.cases (tenant_id, consultant_id, category, status, audit_type, training_categories)
  VALUES (v_tenant_id, p_consultant_id, p_case_category, 'draft', p_audit_type, p_training_categories)
  RETURNING id INTO v_case_id;

  -- 9. Débiter le portefeuille
  UPDATE public.credits_wallet
  SET balance = balance - v_cost,
      updated_at = now()
  WHERE consultant_id = p_consultant_id;

  -- 10. Log Transaction
  INSERT INTO public.transactions (wallet_id, amount, transaction_type, description)
  VALUES (p_consultant_id, -v_cost, 'usage', 'Creation dossier ' || p_case_category || ' pour ' || p_tenant_name);

  RETURN jsonb_build_object(
    'case_id', v_case_id, 
    'tenant_id', v_tenant_id, 
    'new_balance', v_wallet_balance - v_cost
  );
END;
$$;

-- Function to rollback a failed case creation (auth failure)
CREATE OR REPLACE FUNCTION public.rollback_case_creation(
  p_tenant_id uuid,
  p_consultant_id uuid,
  p_cost int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Refund the credits
  UPDATE public.credits_wallet
  SET balance = balance + p_cost,
      updated_at = now()
  WHERE consultant_id = p_consultant_id;

  -- 2. Log the rollback transaction
  INSERT INTO public.transactions (wallet_id, amount, transaction_type, description)
  VALUES (p_consultant_id, p_cost, 'refund', 'Remboursement suite à échec création compte client pour tenant ' || p_tenant_id);

  -- 3. Delete the case(s) associated with the tenant
  DELETE FROM public.cases WHERE tenant_id = p_tenant_id;

  -- 4. Delete the tenant
  DELETE FROM public.tenants WHERE id = p_tenant_id;
END;
$$;

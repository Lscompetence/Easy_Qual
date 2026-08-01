-- 1. Add is_internal column to profiles table to track internal users (consultants)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_internal boolean DEFAULT false;

-- 2. Add paid_credits column to cases table to track maximum credits paid for a case
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS paid_credits integer DEFAULT 1;

-- Helper function to calculate distinct Qualiopi categories count
CREATE OR REPLACE FUNCTION public.get_distinct_qualiopi_categories_count(p_categories text[])
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cat text;
  v_distinct_count int;
BEGIN
  IF p_categories IS NULL OR array_length(p_categories, 1) IS NULL THEN
    RETURN 0;
  END IF;

  SELECT count(DISTINCT CASE 
    WHEN lower(c) LIKE '%bilan%' THEN 'BC'
    WHEN lower(c) LIKE '%vae%' OR lower(c) LIKE '%validation%' THEN 'VAE'
    WHEN lower(c) LIKE '%cfa%' OR lower(c) LIKE '%apprentissage%' OR lower(c) LIKE '%altern%' THEN 'CFA'
    ELSE 'AFC'
  END)
  INTO v_distinct_count
  FROM unnest(p_categories) AS c;

  RETURN v_distinct_count;
END;
$$;

-- Initialize paid_credits for existing cases
UPDATE public.cases
SET paid_credits = CASE 
  WHEN category = 'multi-site' THEN 2 
  ELSE 1 
END + COALESCE(
  NULLIF(
    public.get_distinct_qualiopi_categories_count(training_categories) - 1,
    -1
  ), 
  0
);

-- Update create_case_and_debit to charge using the dynamic pricing formula
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
  v_distinct_count int;
  v_cost int;
  v_wallet_balance int;
  v_tenant_id uuid;
  v_case_id uuid;
  v_existing_auth_id uuid;
  v_existing_tenant_id uuid;
  v_is_internal boolean;
BEGIN
  -- 1. Basic validation
  IF p_client_email IS NULL OR p_client_email = '' THEN
    RAISE EXCEPTION 'Email du client obligatoire';
  END IF;

  -- 2. Verify SIRET in tenants
  IF p_siret IS NOT NULL AND p_siret <> '' THEN
    SELECT id INTO v_existing_tenant_id FROM public.tenants WHERE siret = p_siret LIMIT 1;
    IF v_existing_tenant_id IS NOT NULL THEN
      RAISE EXCEPTION 'Ce numéro SIRET (% ) est déjà utilisé par un autre client.', p_siret;
    END IF;
  END IF;

  -- 3. Verify Email in tenants
  SELECT id INTO v_existing_tenant_id FROM public.tenants WHERE lower(client_email) = lower(p_client_email) LIMIT 1;
  IF v_existing_tenant_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cet email (% ) est déjà associé à un dossier client dans l''application.', p_client_email;
  END IF;

  -- 4. Verify Email in Supabase Auth
  SELECT id INTO v_existing_auth_id
  FROM auth.users
  WHERE lower(email) = lower(p_client_email)
  LIMIT 1;

  IF v_existing_auth_id IS NOT NULL THEN
    RAISE EXCEPTION 'Un compte avec cet email (% ) existe déjà sur la plateforme (Auth). Impossible de créer un nouveau dossier avec cet email.', p_client_email;
  END IF;

  -- Check if consultant is internal
  SELECT COALESCE(is_internal, false) INTO v_is_internal
  FROM public.profiles
  WHERE id = p_consultant_id;

  -- 5. Calculate cost dynamically based on category and training categories
  IF v_is_internal THEN
    v_cost := 0; -- Internal consultants do not pay credits
  ELSE
    v_distinct_count := public.get_distinct_qualiopi_categories_count(p_training_categories);

    IF p_case_category = 'mono-site' THEN
      v_cost := 1 + GREATEST(0, v_distinct_count - 1);
    ELSIF p_case_category = 'multi-site' THEN
      v_cost := 2 + GREATEST(0, v_distinct_count - 1);
    ELSE
      RAISE EXCEPTION 'Catégorie invalide. Doit être mono-site ou multi-site';
    END IF;
  END IF;

  -- 6. Check wallet balance and debit if cost > 0
  IF v_cost > 0 THEN
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

    -- Debit Wallet
    UPDATE public.credits_wallet
    SET balance = balance - v_cost,
        updated_at = now()
    WHERE consultant_id = p_consultant_id;

    -- Log Transaction
    INSERT INTO public.transactions (wallet_id, amount, transaction_type, description)
    VALUES (p_consultant_id, -v_cost, 'usage', 'Creation dossier ' || p_case_category || ' pour ' || p_tenant_name || ' (' || v_cost || ' cr.)');
  END IF;

  -- 7. Create Tenant (OF)
  INSERT INTO public.tenants (name, siret, created_by, client_email, initial_password)
  VALUES (p_tenant_name, p_siret, p_consultant_id, p_client_email, p_initial_password)
  RETURNING id INTO v_tenant_id;

  -- 8. Create Case
  INSERT INTO public.cases (tenant_id, consultant_id, category, status, audit_type, training_categories, paid_credits)
  VALUES (v_tenant_id, p_consultant_id, p_case_category, 'draft', p_audit_type, p_training_categories, v_cost)
  RETURNING id INTO v_case_id;

  RETURN jsonb_build_object(
    'case_id', v_case_id, 
    'tenant_id', v_tenant_id
  );
END;
$$;


-- 11. RPC for updating case, client info, and debiting credits dynamically if added
CREATE OR REPLACE FUNCTION public.update_case_and_debit(
  p_case_id uuid,
  p_consultant_id uuid,
  p_tenant_name text,
  p_siret text,
  p_client_email text,
  p_case_category text, -- 'mono-site' or 'multi-site'
  p_audit_type text[],
  p_training_categories text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_category text;
  v_old_paid_credits int;
  v_new_distinct_count int;
  v_new_cost int;
  v_charge int;
  v_wallet_balance int;
  v_tenant_id uuid;
  v_is_internal boolean;
BEGIN
  -- 1. Get current case details
  SELECT tenant_id, category, COALESCE(paid_credits, 1)
  INTO v_tenant_id, v_old_category, v_old_paid_credits
  FROM public.cases
  WHERE id = p_case_id AND consultant_id = p_consultant_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Dossier non trouvé ou non autorisé';
  END IF;

  -- Check if consultant is internal
  SELECT COALESCE(is_internal, false) INTO v_is_internal
  FROM public.profiles
  WHERE id = p_consultant_id;

  -- 2. Calculate the new cost
  IF v_is_internal THEN
    v_charge := 0; -- Internal consultants do not pay credits
  ELSE
    v_new_distinct_count := public.get_distinct_qualiopi_categories_count(p_training_categories);
    
    -- Cost formula: Base + max(0, N - 1)
    IF p_case_category = 'mono-site' THEN
      v_new_cost := 1 + GREATEST(0, v_new_distinct_count - 1);
    ELSIF p_case_category = 'multi-site' THEN
      v_new_cost := 2 + GREATEST(0, v_new_distinct_count - 1);
    ELSE
      RAISE EXCEPTION 'Catégorie de site invalide. Doit être mono-site ou multi-site';
    END IF;

    -- 3. Calculate charge
    -- IMPORTANT / WARNING: Le retrait d'une catégorie ou d'un site ne déclenche aucun recalcul à la baisse (pas de remboursement).
    -- A écrire et commenter dans le code : sinon quelqu'un l'implémentera un jour « par symétrie ».
    IF v_new_cost > v_old_paid_credits THEN
      v_charge := v_new_cost - v_old_paid_credits;
    ELSE
      v_charge := 0;
    END IF;
  END IF;

  -- 4. Check wallet and debit if charge > 0
  IF v_charge > 0 THEN
    SELECT balance INTO v_wallet_balance
    FROM public.credits_wallet
    WHERE consultant_id = p_consultant_id
    FOR UPDATE;

    IF v_wallet_balance IS NULL THEN
      RAISE EXCEPTION 'Portefeuille non trouvé';
    END IF;

    IF v_wallet_balance < v_charge THEN
      RAISE EXCEPTION 'Solde insuffisant (Requis: %, Disponible: %)', v_charge, v_wallet_balance;
    END IF;

    -- Debit wallet
    UPDATE public.credits_wallet
    SET balance = balance - v_charge,
        updated_at = now()
    WHERE consultant_id = p_consultant_id;

    -- Log transaction
    INSERT INTO public.transactions (wallet_id, amount, transaction_type, description)
    VALUES (p_consultant_id, -v_charge, 'usage', 'Mise à jour dossier ' || p_case_category || ' pour ' || p_tenant_name || ' (+ ' || v_charge || ' cr.)');
  END IF;

  -- 5. Update Tenant
  UPDATE public.tenants
  SET name = p_tenant_name,
      siret = p_siret,
      client_email = p_client_email
  WHERE id = v_tenant_id;

  -- 6. Update Case
  -- We update paid_credits to the new higher cost (we never decrease it)
  UPDATE public.cases
  SET category = p_case_category,
      audit_type = p_audit_type,
      training_categories = p_training_categories,
      paid_credits = GREATEST(v_old_paid_credits, COALESCE(v_new_cost, 0))
  WHERE id = p_case_id;

  -- Return state
  SELECT balance INTO v_wallet_balance
  FROM public.credits_wallet
  WHERE consultant_id = p_consultant_id;

  RETURN jsonb_build_object(
    'success', true,
    'charge', v_charge,
    'new_balance', COALESCE(v_wallet_balance, 0)
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.update_case_and_debit(uuid, uuid, text, text, text, text, text[], text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_case_and_debit(uuid, uuid, text, text, text, text, text[], text[]) TO anon;

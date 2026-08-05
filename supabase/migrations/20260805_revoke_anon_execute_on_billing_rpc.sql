-- =============================================================================
-- SÉCURITÉ (critique) : retrait du droit d'exécution au rôle "anon" sur les
-- fonctions de facturation.
--
-- Contexte : ces fonctions sont SECURITY DEFINER (elles contournent la RLS) et
-- étaient accordées à "anon". Or la clé anon est publique : elle est embarquée
-- dans le bundle JavaScript du site. N'importe qui pouvait donc appeler
--
--     POST /rest/v1/rpc/add_credits
--     { "p_consultant_id": "<uuid>", "p_amount": 999999 }
--
-- et créditer gratuitement un compte consultant (crédits vendus 160 à 200 € pièce),
-- ou créer/mettre à jour des dossiers sans être authentifié.
--
-- Règle appliquée :
--   * add_credits            -> service_role uniquement (appelée par le webhook Stripe)
--   * create_case_and_debit  -> authenticated uniquement (consultant connecté)
--   * update_case_and_debit  -> authenticated uniquement (consultant connecté)
--
-- Les boucles ci-dessous couvrent toutes les surcharges existantes, afin qu'aucune
-- signature héritée d'une ancienne migration ne reste ouverte.
-- =============================================================================

-- 1. Retrait de "anon" sur les trois fonctions
DO $$
DECLARE fn record;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN ('add_credits', 'create_case_and_debit', 'update_case_and_debit')
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', fn.sig);
        RAISE NOTICE 'REVOKE anon -> %', fn.sig;
    END LOOP;
END $$;

-- 2. add_credits : retrait également de "authenticated".
--    Seul le webhook Stripe (clé service_role) doit pouvoir créditer un compte,
--    sinon un consultant connecté pourrait s'auto-créditer sans payer.
DO $$
DECLARE fn record;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'add_credits'
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', fn.sig);
        RAISE NOTICE 'REVOKE authenticated -> %', fn.sig;
    END LOOP;
END $$;

-- 3. Empêcher PUBLIC (donc tout nouveau rôle) d'hériter du droit d'exécution
DO $$
DECLARE fn record;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN ('add_credits', 'create_case_and_debit', 'update_case_and_debit')
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn.sig);
    END LOOP;
END $$;

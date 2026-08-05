-- =============================================================================
-- SÉCURITÉ : durcissement des fonctions SECURITY DEFINER exposées via l'API REST.
--
-- Signalé par "supabase db advisors --type security".
-- Toutes ces fonctions contournent la RLS ; certaines étaient appelables par le
-- rôle "anon", donc par quiconque possède la clé publique du site.
--
-- Usages réels vérifiés dans le code avant modification :
--   admin_create_consultant_rpc  : appelée nulle part (vestige) -> service_role seul
--   get_auth_user_id             : NewCaseModal (consultant) + invite-client (service)
--   sync_client_profile_name     : UpdateCaseModal (consultant)
--   sync_tenant_name_from_client : appelée nulle part
--   get_distinct_...categories   : appelée nulle part
--   handle_new_user / _wallet    : fonctions de trigger, jamais appelées via l'API
--   is_admin                     : utilisée dans les policies RLS -> laissée intacte
-- =============================================================================

-- 1. CRITIQUE : admin_create_consultant_rpc créait un consultant avec un nombre
--    de crédits arbitraire, sans authentification.
DO $$
DECLARE fn record;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'admin_create_consultant_rpc'
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, PUBLIC', fn.sig);
    END LOOP;
END $$;

-- 2. Fonctions de trigger : ne doivent jamais être invoquées via /rest/v1/rpc
DO $$
DECLARE fn record;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN ('handle_new_user', 'handle_new_consultant_wallet')
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, PUBLIC', fn.sig);
    END LOOP;
END $$;

-- 3. Retrait du seul rôle "anon" : ces fonctions restent utilisables par les
--    utilisateurs connectés (et par le service_role côté edge functions).
--    get_auth_user_id permettait notamment d'énumérer les comptes existants.
DO $$
DECLARE fn record;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'get_auth_user_id',
              'sync_client_profile_name',
              'sync_tenant_name_from_client',
              'get_distinct_qualiopi_categories_count'
          )
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, PUBLIC', fn.sig);
    END LOOP;
END $$;

-- 4. search_path figé sur les fonctions SECURITY DEFINER.
--    Sans cela, un rôle peut créer un objet dans un schéma prioritaire et
--    détourner l'exécution de la fonction (élévation de privilèges).
DO $$
DECLARE fn record;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef                                   -- SECURITY DEFINER
          AND (p.proconfig IS NULL
               OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c
                              WHERE c LIKE 'search\_path=%'))
    LOOP
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn.sig);
    END LOOP;
END $$;

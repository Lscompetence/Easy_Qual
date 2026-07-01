-- ============================================================================
-- SYNC INVERSE du nom : quand le CLIENT modifie son profil (first/last name),
-- répercuter dans tenants.name (ce que voit le consultant sur le dossier).
--
-- Le client n'a qu'un accès SELECT sur tenants (RLS). Cette fonction
-- SECURITY DEFINER met à jour UNIQUEMENT le tenant dont il est propriétaire
-- (owner_id = auth.uid()), donc aucun risque de toucher un autre dossier.
--
-- Combinée à sync_client_profile_name (consultant -> client), le nom reste
-- cohérent des deux côtés, quel que soit le côté qui le modifie.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_tenant_name_from_client(p_full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_name text := trim(coalesce(p_full_name, ''));
BEGIN
    IF v_name = '' THEN
        RETURN;
    END IF;

    UPDATE public.tenants
    SET name = v_name
    WHERE owner_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_tenant_name_from_client(text) TO authenticated;

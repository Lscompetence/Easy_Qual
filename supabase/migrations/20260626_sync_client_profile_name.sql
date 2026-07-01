-- ============================================================================
-- SYNC du nom client : quand le consultant modifie le nom (tenants.name),
-- répercuter dans le profil du client (profiles.first_name/last_name).
--
-- profiles n'autorise l'UPDATE que de son propre profil (id = auth.uid()).
-- Cette fonction SECURITY DEFINER contourne ce verrou de façon contrôlée :
-- elle vérifie d'abord que l'appelant est bien le consultant propriétaire
-- du tenant (tenants.created_by = auth.uid()) avant d'écrire.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_client_profile_name(p_tenant_id uuid, p_full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner uuid;
    v_first text;
    v_last  text;
    v_name  text := trim(coalesce(p_full_name, ''));
BEGIN
    -- 1. Sécurité : l'appelant doit être le consultant propriétaire du tenant.
    --    On récupère au passage le client lié (owner_id).
    SELECT owner_id INTO v_owner
    FROM public.tenants
    WHERE id = p_tenant_id
      AND created_by = auth.uid();

    -- Pas autorisé, ou aucun client encore lié au dossier : on ne fait rien.
    IF v_owner IS NULL OR v_name = '' THEN
        RETURN;
    END IF;

    -- 2. Découpe "Prénom Nom" : 1er mot -> first_name, le reste -> last_name.
    v_first := split_part(v_name, ' ', 1);
    v_last  := trim(substr(v_name, length(v_first) + 1));

    -- 3. Mise à jour du profil du client.
    UPDATE public.profiles
    SET first_name = v_first,
        last_name  = v_last
    WHERE id = v_owner;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_client_profile_name(uuid, text) TO authenticated;

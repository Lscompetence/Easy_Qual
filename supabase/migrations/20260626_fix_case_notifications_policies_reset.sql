-- ============================================================================
-- RESET COMPLET des politiques RLS de case_notifications
-- Une politique fautive (référençant auth.users, possiblement via une fonction)
-- subsiste et casse toute lecture. On repart de zéro avec 3 politiques propres.
-- ============================================================================

-- 1. Supprimer TOUTES les politiques existantes sur case_notifications
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'case_notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.case_notifications', pol.policyname);
    END LOOP;
END $$;

-- 2. Consultant : gère les notifications de ses dossiers (via tenants.created_by)
CREATE POLICY "Consultants_manage_notifications_v3"
ON public.case_notifications FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_notifications.case_id
        AND t.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_notifications.case_id
        AND t.created_by = auth.uid()
    )
);

-- 3. Client : lit ses notifications
CREATE POLICY "Clients_view_notifications_v3"
ON public.case_notifications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_notifications.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

-- 4. Client : insère ses notifications
CREATE POLICY "Clients_insert_notifications_v3"
ON public.case_notifications FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_notifications.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

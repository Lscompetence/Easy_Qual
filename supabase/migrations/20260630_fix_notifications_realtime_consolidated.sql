-- ============================================================================
-- FIX CONSOLIDÉ — Notifications/Toasts & Messagerie temps réel (client ⇄ consultant)
-- Date: 2026-06-30
--
-- Regroupe les correctifs des migrations du 26/06 en un seul script idempotent :
--   1) Supprime toute politique RLS qui lit auth.users (=> "permission denied")
--   2) Recrée les politiques CLIENT avec (auth.jwt() ->> 'email')  [sûr]
--   3) Recrée la politique CONSULTANT en couvrant cases.consultant_id
--      ET tenants.created_by (robuste si un dossier a été réassigné)
--   4) S'assure que case_notifications ET case_messages sont publiées en Realtime
--   5) Vérification finale en lecture seule
-- ============================================================================

-- ─── 1. NETTOYAGE : drop de toute politique référençant auth.users ──────────
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'tenants', 'cases', 'case_messages',
              'case_indicator_states', 'case_notifications',
              'case_events', 'consultant_resources'
          )
          AND (
              COALESCE(qual, '')        ILIKE '%auth.users%'
              OR COALESCE(with_check, '') ILIKE '%auth.users%'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                       pol.policyname, pol.tablename);
        RAISE NOTICE 'Dropped broken policy % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- ─── 2. CASE_NOTIFICATIONS : reset propre des politiques ────────────────────
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

-- Consultant : gère les notifications de SES dossiers
-- (couvre cases.consultant_id ET tenants.created_by)
CREATE POLICY "Consultants_manage_notifications_v4"
ON public.case_notifications FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        LEFT JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_notifications.case_id
        AND (c.consultant_id = auth.uid() OR t.created_by = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cases c
        LEFT JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_notifications.case_id
        AND (c.consultant_id = auth.uid() OR t.created_by = auth.uid())
    )
);

-- Client : lit les notifications de ses dossiers
CREATE POLICY "Clients_view_notifications_v4"
ON public.case_notifications FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_notifications.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

-- Client : insère les notifications de ses dossiers
CREATE POLICY "Clients_insert_notifications_v4"
ON public.case_notifications FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_notifications.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

-- ─── 3. CASE_MESSAGES : politique client (sans auth.users) ──────────────────
DROP POLICY IF EXISTS "Clients_manage_messages_v5" ON public.case_messages;
CREATE POLICY "Clients_manage_messages_v5"
ON public.case_messages FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON c.tenant_id = t.id
        WHERE c.id = case_messages.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON c.tenant_id = t.id
        WHERE c.id = case_messages.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

-- ─── 4. REALTIME : publier les 2 tables (idempotent) ────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
          AND tablename = 'case_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.case_notifications;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
          AND tablename = 'case_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.case_messages;
    END IF;
END $$;

-- ─── 5. VÉRIFICATION FINALE ─────────────────────────────────────────────────
-- (a) Realtime : doit renvoyer 2 lignes
SELECT 'realtime' AS check, tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
  AND tablename IN ('case_notifications', 'case_messages');

-- (b) Policies cassées : doit renvoyer 0 ligne
SELECT 'broken_policy' AS check, tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
  AND (COALESCE(qual,'') ILIKE '%auth.users%' OR COALESCE(with_check,'') ILIKE '%auth.users%');

-- ============================================================================
-- FIX TOASTS / NOTIFICATIONS — RLS "permission denied for table users" + Realtime
-- Date: 2026-06-26
--
-- PROBLÈME
--   Plusieurs politiques RLS "client" utilisent une sous-requête sur auth.users :
--       client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
--   Supabase interdit la lecture de auth.users aux rôles authenticated/anon,
--   ce qui fait échouer TOUTE requête concernée avec :
--       ERROR 42501: permission denied for table users
--   Conséquence : le client ne peut plus lire case_notifications -> aucun toast,
--   et les historiques (consultant + apprenant) restent vides.
--
-- SOLUTION
--   1) Supprimer dynamiquement toute politique référençant auth.users sur les
--      tables concernées (les politiques consultant/admin utilisent auth.uid()
--      et ne sont donc PAS touchées).
--   2) Recréer les politiques client avec (auth.jwt() ->> 'email') — direct et sûr.
--   3) S'assurer que case_notifications est bien publiée en Realtime.
-- ============================================================================

-- ─── 1. NETTOYAGE : drop de toute politique référençant auth.users ──────────
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'tenants', 'cases', 'case_messages',
              'case_indicator_states', 'case_notifications',
              'case_events', 'consultant_resources'
          )
          AND (
              COALESCE(qual, '')       ILIKE '%auth.users%'
              OR COALESCE(with_check, '') ILIKE '%auth.users%'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                       pol.policyname, pol.tablename);
        RAISE NOTICE 'Dropped broken policy % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- ─── 2. RECRÉATION DES POLITIQUES CLIENT (sans auth.users) ──────────────────

-- TENANTS : le client voit son propre tenant
DROP POLICY IF EXISTS "Clients_view_tenant_v3" ON public.tenants;
CREATE POLICY "Clients_view_tenant_v3"
ON public.tenants FOR SELECT
USING (owner_id = auth.uid() OR client_email = (auth.jwt() ->> 'email'));

-- CASES : le client voit les dossiers de son tenant
DROP POLICY IF EXISTS "Clients_view_case_v3" ON public.cases;
CREATE POLICY "Clients_view_case_v3"
ON public.cases FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tenants t
        WHERE t.id = cases.tenant_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

-- CASE_MESSAGES : le client gère les messages de ses dossiers
DROP POLICY IF EXISTS "Clients_manage_messages_v4" ON public.case_messages;
CREATE POLICY "Clients_manage_messages_v4"
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

-- CASE_INDICATOR_STATES : le client lit l'état des indicateurs de ses dossiers
DROP POLICY IF EXISTS "Clients_read_states_v3" ON public.case_indicator_states;
CREATE POLICY "Clients_read_states_v3"
ON public.case_indicator_states FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_indicator_states.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

-- CASE_NOTIFICATIONS : le client lit ET insère ses notifications (toasts)
DROP POLICY IF EXISTS "Clients_view_notifications_v3" ON public.case_notifications;
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

DROP POLICY IF EXISTS "Clients_insert_notifications_v3" ON public.case_notifications;
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

-- CASE_EVENTS : le client voit les séances de ses dossiers
-- (l'ancienne politique pointait par erreur sur auth.users.tenant_id)
DROP POLICY IF EXISTS "Clients_view_events_v3" ON public.case_events;
CREATE POLICY "Clients_view_events_v3"
ON public.case_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_events.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

-- ─── 3. REALTIME : publier case_notifications (idempotent) ───────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'case_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.case_notifications;
        RAISE NOTICE 'case_notifications added to supabase_realtime';
    END IF;
END $$;

-- ─── 4. VÉRIFICATION (lecture seule) ────────────────────────────────────────
-- Doit renvoyer 0 ligne si plus aucune politique ne référence auth.users :
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname='public'
--   AND (COALESCE(qual,'') ILIKE '%auth.users%' OR COALESCE(with_check,'') ILIKE '%auth.users%');

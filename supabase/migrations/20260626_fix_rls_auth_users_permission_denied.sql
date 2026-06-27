-- ============================================================
-- FIX: REMOVE UNSUPPORTED SUBQUERIES ON auth.users IN RLS POLICIES
-- Date: 2026-06-26
-- Description:
--   Queries on auth.users in RLS policies throw 'permission denied for table users'
--   for non-admin users (authenticated/anonymous roles) in production Supabase.
--   We replace them with `(auth.jwt() ->> 'email')` which is safe and direct.
-- ============================================================

-- 1. TENANTS RLS
DROP POLICY IF EXISTS "Clients_view_tenant_v2" ON public.tenants;
CREATE POLICY "Clients_view_tenant_v2"
ON public.tenants FOR SELECT
USING (owner_id = auth.uid() OR client_email = (auth.jwt() ->> 'email'));

-- 2. CASES RLS
DROP POLICY IF EXISTS "Clients_view_case_v2" ON public.cases;
CREATE POLICY "Clients_view_case_v2"
ON public.cases FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tenants t
        WHERE t.id = public.cases.tenant_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

-- 3. CASE MESSAGES RLS
DROP POLICY IF EXISTS "Clients_manage_messages_v3" ON public.case_messages;
CREATE POLICY "Clients_manage_messages_v3"
ON public.case_messages
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON c.tenant_id = t.id
        WHERE c.id = public.case_messages.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON c.tenant_id = t.id
        WHERE c.id = public.case_messages.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

-- 4. CASE INDICATOR STATES RLS
DROP POLICY IF EXISTS "Clients_read_states_v2" ON public.case_indicator_states;
CREATE POLICY "Clients_read_states_v2"
ON public.case_indicator_states FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_indicator_states.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

-- 5. CASE NOTIFICATIONS RLS
DROP POLICY IF EXISTS "Clients can view their own notifications" ON public.case_notifications;
CREATE POLICY "Clients can view their own notifications"
ON public.case_notifications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_notifications.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

DROP POLICY IF EXISTS "Clients can insert their own notifications" ON public.case_notifications;
CREATE POLICY "Clients can insert their own notifications"
ON public.case_notifications FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_notifications.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (auth.jwt() ->> 'email'))
    )
);

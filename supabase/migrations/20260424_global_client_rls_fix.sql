-- GLOBAL FIX: Ensure clients can access their data via email matching if owner_id is not set
-- This covers tenants, cases, and case_messages

-- 1. TENANTS
DROP POLICY IF EXISTS "Clients can view their own tenant" ON public.tenants;
CREATE POLICY "Clients_view_tenant_v2"
ON public.tenants FOR SELECT
USING (owner_id = auth.uid() OR client_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 2. CASES
DROP POLICY IF EXISTS "Clients can view their own case" ON public.cases;
CREATE POLICY "Clients_view_case_v2"
ON public.cases FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tenants t
        WHERE t.id = public.cases.tenant_id
        AND (t.owner_id = auth.uid() OR t.client_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
);

-- 3. CASE_MESSAGES
DROP POLICY IF EXISTS "Client_isolation_messages" ON public.case_messages;
DROP POLICY IF EXISTS "Client_isolation_messages_v2" ON public.case_messages;
DROP POLICY IF EXISTS "Clients can manage their case messages" ON public.case_messages;

CREATE POLICY "Clients_manage_messages_v3"
ON public.case_messages
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON c.tenant_id = t.id
        WHERE c.id = public.case_messages.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON c.tenant_id = t.id
        WHERE c.id = public.case_messages.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
);

-- 4. CASE_INDICATOR_STATES
DROP POLICY IF EXISTS "Clients can read their own indicator states" ON public.case_indicator_states;
CREATE POLICY "Clients_read_states_v2"
ON public.case_indicator_states FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON t.id = c.tenant_id
        WHERE c.id = case_indicator_states.case_id
        AND (t.owner_id = auth.uid() OR t.client_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
);

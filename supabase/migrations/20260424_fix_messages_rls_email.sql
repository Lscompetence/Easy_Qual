-- FIX: Allow clients to see messages based on their email as well as owner_id
-- Date: 2026-04-24

DROP POLICY IF EXISTS "Client_isolation_messages" ON public.case_messages;

CREATE POLICY "Client_isolation_messages_v2"
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

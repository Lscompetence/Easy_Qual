-- ============================================================
-- FIX: DÉFINITIVE ISOLATION DES MESSAGES (RLS)
-- Date: 2026-04-13
-- But: Supprimer les anciennes politiques permissives et 
--      verrouiller l'accès aux messages par consultant/client.
-- ============================================================

-- 1. Supprimer TOUTES les anciennes politiques potentiellement permissives
DROP POLICY IF EXISTS "View messages for case participants" ON public.case_messages;
DROP POLICY IF EXISTS "Users can view messages for cases they engage with" ON public.case_messages;
DROP POLICY IF EXISTS "Users can send messages to cases" ON public.case_messages;
DROP POLICY IF EXISTS "Consultants manage their case messages" ON public.case_messages;
DROP POLICY IF EXISTS "Clients can manage their case messages" ON public.case_messages;

-- 2. S'assurer que le RLS est activé
ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;

-- 3. Politique pour les Consultants
-- Un consultant peut voir et gérer les messages UNIQUEMENT si le dossier lui appartient
CREATE POLICY "Consultant_isolation_messages"
ON public.case_messages
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id = public.case_messages.case_id
        AND c.consultant_id = auth.uid()
    )
);

-- 4. Politique pour les Clients (Organismes)
-- Un client peut voir et envoyer des messages UNIQUEMENT pour son propre dossier
CREATE POLICY "Client_isolation_messages"
ON public.case_messages
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON c.tenant_id = t.id
        WHERE c.id = public.case_messages.case_id
        AND t.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cases c
        JOIN public.tenants t ON c.tenant_id = t.id
        WHERE c.id = public.case_messages.case_id
        AND t.owner_id = auth.uid()
    )
);

-- 5. Politique pour les Admins
CREATE POLICY "Admin_full_access_messages"
ON public.case_messages
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

-- 6. Grant basic access (RLS will filter the rows)
GRANT ALL ON public.case_messages TO authenticated;

-- ============================================================
-- FIX: RLS ISOLATION COMPLÈTE - CLIENT & CONSULTANT
-- Date: 2026-03-18
-- But: 
--   1. Chaque consultant voit UNIQUEMENT ses propres clients
--   2. Chaque client peut lire ET écrire SES propres données
--   3. Isolation totale entre consultants
-- ============================================================


-- ============================================================
-- 1. TABLE: cases
--    - Consultant: voit ses propres dossiers
--    - Client: voit son propre dossier (via owner_id sur tenant)
-- ============================================================
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Consultant: voir ses dossiers (via tenants.created_by)
DROP POLICY IF EXISTS "Consultants can view their own cases" ON public.cases;
CREATE POLICY "Consultants can view their own cases"
  ON public.cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = public.cases.tenant_id
      AND t.created_by = auth.uid()
    )
  );

-- Consultant: modifier ses dossiers
DROP POLICY IF EXISTS "Consultants can update their own cases" ON public.cases;
CREATE POLICY "Consultants can update their own cases"
  ON public.cases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = public.cases.tenant_id
      AND t.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = public.cases.tenant_id
      AND t.created_by = auth.uid()
    )
  );

-- Client (of): voir son propre dossier
DROP POLICY IF EXISTS "Clients can view their own case" ON public.cases;
CREATE POLICY "Clients can view their own case"
  ON public.cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = public.cases.tenant_id
      AND t.owner_id = auth.uid()
    )
  );

-- Admin: voir tous les dossiers
DROP POLICY IF EXISTS "Admins can view all cases" ON public.cases;
CREATE POLICY "Admins can view all cases"
  ON public.cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );


-- ============================================================
-- 2. TABLE: case_indicator_states
--    - Consultant: voit et modifie les états de ses dossiers
--    - Client: voit ET peut modifier ses propres états
-- ============================================================
ALTER TABLE public.case_indicator_states ENABLE ROW LEVEL SECURITY;

-- Consultant: gérer les états de ses dossiers
DROP POLICY IF EXISTS "Consultants manage states of their cases" ON public.case_indicator_states;
CREATE POLICY "Consultants manage states of their cases"
  ON public.case_indicator_states FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_indicator_states.case_id
      AND t.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_indicator_states.case_id
      AND t.created_by = auth.uid()
    )
  );

-- Client: lire ses propres états
DROP POLICY IF EXISTS "Clients can read their own indicator states" ON public.case_indicator_states;
CREATE POLICY "Clients can read their own indicator states"
  ON public.case_indicator_states FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_indicator_states.case_id
      AND t.owner_id = auth.uid()
    )
  );

-- Client: modifier ses propres états (statut indicateurs)
DROP POLICY IF EXISTS "Clients can upsert their own indicator states" ON public.case_indicator_states;
CREATE POLICY "Clients can upsert their own indicator states"
  ON public.case_indicator_states FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_indicator_states.case_id
      AND t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients can update their own indicator states" ON public.case_indicator_states;
CREATE POLICY "Clients can update their own indicator states"
  ON public.case_indicator_states FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_indicator_states.case_id
      AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_indicator_states.case_id
      AND t.owner_id = auth.uid()
    )
  );


-- ============================================================
-- 3. TABLE: criterion_quiz_uploads
--    - Consultant: gérer les uploads de ses dossiers
--    - Client: lire ET uploader ses propres fichiers
-- ============================================================
ALTER TABLE public.criterion_quiz_uploads ENABLE ROW LEVEL SECURITY;

-- Consultant: gérer les uploads de ses dossiers
DROP POLICY IF EXISTS "consultants_manage_comments" ON public.criterion_quiz_uploads;
CREATE POLICY "consultants_manage_comments"
  ON public.criterion_quiz_uploads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = criterion_quiz_uploads.case_id
      AND t.created_by = auth.uid()
    )
  );

-- Client: lire ses propres uploads
DROP POLICY IF EXISTS "Clients can read their own uploads" ON public.criterion_quiz_uploads;
CREATE POLICY "Clients can read their own uploads"
  ON public.criterion_quiz_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = criterion_quiz_uploads.case_id
      AND t.owner_id = auth.uid()
    )
  );

-- Client: uploader des fichiers pour ses propres dossiers
DROP POLICY IF EXISTS "Clients can insert their own uploads" ON public.criterion_quiz_uploads;
CREATE POLICY "Clients can insert their own uploads"
  ON public.criterion_quiz_uploads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = criterion_quiz_uploads.case_id
      AND t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients can update their own uploads" ON public.criterion_quiz_uploads;
CREATE POLICY "Clients can update their own uploads"
  ON public.criterion_quiz_uploads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = criterion_quiz_uploads.case_id
      AND t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients can delete their own uploads" ON public.criterion_quiz_uploads;
CREATE POLICY "Clients can delete their own uploads"
  ON public.criterion_quiz_uploads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = criterion_quiz_uploads.case_id
      AND t.owner_id = auth.uid()
    )
  );


-- ============================================================
-- 4. TABLE: case_messages
--    - Consultant: voir/envoyer messages de ses dossiers
--    - Client: voir/envoyer messages de son dossier
-- ============================================================
ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;

-- Consultant: gérer les messages de ses dossiers
DROP POLICY IF EXISTS "Consultants manage their case messages" ON public.case_messages;
CREATE POLICY "Consultants manage their case messages"
  ON public.case_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_messages.case_id
      AND t.created_by = auth.uid()
    )
  );

-- Client: voir et envoyer des messages pour son dossier
DROP POLICY IF EXISTS "Clients can manage their case messages" ON public.case_messages;
CREATE POLICY "Clients can manage their case messages"
  ON public.case_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_messages.case_id
      AND t.owner_id = auth.uid()
    )
  );


-- ============================================================
-- 5. TABLE: tenants
--    - Consultant: voir ses propres tenants
--    - Client: voir son propre tenant
-- ============================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Consultant: voir ses tenants
DROP POLICY IF EXISTS "Consultants can view their tenants" ON public.tenants;
CREATE POLICY "Consultants can view their tenants"
  ON public.tenants FOR ALL
  USING (created_by = auth.uid());

-- Client: voir son propre tenant
DROP POLICY IF EXISTS "Clients can view their own tenant" ON public.tenants;
CREATE POLICY "Clients can view their own tenant"
  ON public.tenants FOR SELECT
  USING (owner_id = auth.uid());

-- Admin: voir tous les tenants
DROP POLICY IF EXISTS "Admins can view all tenants" ON public.tenants;
CREATE POLICY "Admins can view all tenants"
  ON public.tenants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );


-- ============================================================
-- 6. GRANTS - S'assurer que les rôles ont accès aux tables
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.case_indicator_states TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.criterion_quiz_uploads TO authenticated;
GRANT SELECT, INSERT ON public.case_messages TO authenticated;
GRANT SELECT ON public.cases TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT ON public.criteria TO authenticated;
GRANT SELECT ON public.indicators TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

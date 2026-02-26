-- ==========================================
-- FIX RLS POLICIES FOR CONSULTANTS
-- ==========================================

-- 1. Reference Data (Indicators & Criteria)
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS progress numeric DEFAULT 0;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS last_sync_at timestamptz DEFAULT now();

ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_criteria" ON public.criteria;
CREATE POLICY "public_read_criteria" ON public.criteria 
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_indicators" ON public.indicators;
CREATE POLICY "public_read_indicators" ON public.indicators 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Case Indicator States (Verdicts & Progress)
ALTER TABLE public.case_indicator_states ENABLE ROW LEVEL SECURITY;
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

-- 3. Cases Management (Main Case Progress/Status)
-- Allow consultants to update progress and status of their own cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
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

-- 4. Criterion Quiz Uploads (Comments)
-- Ensure consultants can manage comments/quiz
ALTER TABLE public.criterion_quiz_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consultants_manage_comments" ON public.criterion_quiz_uploads;
CREATE POLICY "consultants_manage_comments" ON public.criterion_quiz_uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = criterion_quiz_uploads.case_id
      AND t.created_by = auth.uid()
    )
  );

-- Grant direct table access just in case
GRANT SELECT ON public.criteria TO authenticated;
GRANT SELECT ON public.indicators TO authenticated;
GRANT ALL ON public.case_indicator_states TO authenticated;
GRANT ALL ON public.criterion_quiz_uploads TO authenticated;
GRANT ALL ON public.cases TO authenticated;
GRANT ALL ON public.tenants TO authenticated;

-- ============================================================
-- Indicator Review Workflow
-- ============================================================

-- 1. Add consultant_verdict to case_indicator_states
ALTER TABLE public.case_indicator_states
  ADD COLUMN IF NOT EXISTS consultant_comment text,
  ADD COLUMN IF NOT EXISTS consultant_verdict text; -- 'validated' | 'non_conforme'

-- 2. New table: quiz uploads per criterion per case
CREATE TABLE IF NOT EXISTS public.criterion_quiz_uploads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  criterion_id int  NOT NULL,
  audit_type  text NOT NULL DEFAULT 'initial',
  file_url    text NOT NULL,
  file_name   text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id),
  UNIQUE(case_id, criterion_id, audit_type)
);

-- 3. RLS
ALTER TABLE public.criterion_quiz_uploads ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own uploads
CREATE POLICY "client_own_uploads" ON public.criterion_quiz_uploads
  FOR ALL USING (uploaded_by = auth.uid());

-- All authenticated users (consultants) can read quiz uploads
CREATE POLICY "authenticated_read_uploads" ON public.criterion_quiz_uploads
  FOR SELECT USING (auth.role() = 'authenticated');

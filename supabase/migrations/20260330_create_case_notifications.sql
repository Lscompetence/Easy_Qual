-- ============================================================
-- NOUVELLE TABLE: case_notifications
-- But: Isoler les événements système de la discussion humaine
-- ============================================================

CREATE TABLE IF NOT EXISTS public.case_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'status_change', 'file_upload', 'password_change', etc.
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.case_notifications ENABLE ROW LEVEL SECURITY;

-- Consultant: gérer les notifications de ses dossiers
CREATE POLICY "Consultants manage their case notifications"
  ON public.case_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_notifications.case_id
      AND t.created_by = auth.uid()
    )
  );

-- Client: voir ses notifications
CREATE POLICY "Clients can view their own notifications"
  ON public.case_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_notifications.case_id
      AND t.owner_id = auth.uid()
    )
  );

-- Client: insérer ses notifications
CREATE POLICY "Clients can insert their own notifications"
  ON public.case_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      JOIN public.tenants t ON t.id = c.tenant_id
      WHERE c.id = case_notifications.case_id
      AND t.owner_id = auth.uid()
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_notifications TO authenticated;

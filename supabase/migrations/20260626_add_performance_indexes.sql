-- ============================================================================
-- INDEX DE PERFORMANCE — corrige les "statement timeout" (code 57014)
--
-- Les politiques RLS évaluent des EXISTS avec jointures sur case_id / tenant_id.
-- Ces colonnes (clés étrangères) ne sont PAS indexées par défaut en Postgres,
-- ce qui force des scans séquentiels et fait dépasser le statement_timeout.
-- Ces index rendent les vérifications RLS et les filtres .eq(case_id) instantanés.
-- Tout est idempotent (IF NOT EXISTS) et purement additif (aucune politique modifiée).
-- ============================================================================

-- Colonnes filtrées par case_id (pages de dossier)
CREATE INDEX IF NOT EXISTS idx_case_indicator_states_case_id ON public.case_indicator_states (case_id);
CREATE INDEX IF NOT EXISTS idx_case_messages_case_id        ON public.case_messages (case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_case_id          ON public.case_events (case_id);
CREATE INDEX IF NOT EXISTS idx_case_notifications_case_id   ON public.case_notifications (case_id);
CREATE INDEX IF NOT EXISTS idx_criterion_quiz_uploads_case_id ON public.criterion_quiz_uploads (case_id);

-- Jointure cases -> tenants (utilisée dans presque toutes les politiques RLS)
CREATE INDEX IF NOT EXISTS idx_cases_tenant_id ON public.cases (tenant_id);

-- Colonnes de tenants utilisées dans les politiques RLS (consultant + client)
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id     ON public.tenants (owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_created_by   ON public.tenants (created_by);
CREATE INDEX IF NOT EXISTS idx_tenants_client_email ON public.tenants (client_email);

-- Lien consultant <-> dossier
CREATE INDEX IF NOT EXISTS idx_cases_consultant_id ON public.cases (consultant_id);

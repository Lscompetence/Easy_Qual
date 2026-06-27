-- ============================================================================
-- ANO-03 : critères éliminatoires (logo / certificat) intégrés au calcul.
-- Stockés par dossier, par type d'audit et par critère.
-- Structure : { "<type d'audit>": { "logo": "non_conforme"|"conforme", "certificat": "..." } }
-- Vide par défaut = aucun critère éliminatoire non respecté.
-- ============================================================================

ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS eliminatoires jsonb NOT NULL DEFAULT '{}'::jsonb;

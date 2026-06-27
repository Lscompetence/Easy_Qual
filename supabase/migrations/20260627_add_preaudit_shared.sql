-- ============================================================================
-- PRÉ-AUDIT : partage de l'avis au client.
-- Colonne booléenne sur cases. Par défaut FALSE (avis non partagé).
-- Le consultant l'active via le toggle dans la page du dossier.
-- ============================================================================

ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS preaudit_shared boolean NOT NULL DEFAULT false;

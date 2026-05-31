-- Ajout des colonnes pour l'émargement (signatures) des Visios

ALTER TABLE case_events 
ADD COLUMN IF NOT EXISTS consultant_signature TEXT,
ADD COLUMN IF NOT EXISTS consultant_signature_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consultant_signature_name TEXT,
ADD COLUMN IF NOT EXISTS client_signature TEXT,
ADD COLUMN IF NOT EXISTS client_signature_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_signature_name TEXT,
ADD COLUMN IF NOT EXISTS actual_start_time TIME,
ADD COLUMN IF NOT EXISTS actual_end_time TIME;

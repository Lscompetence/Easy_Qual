-- Add audit_type to case_indicator_states if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_indicator_states' AND column_name = 'audit_type') THEN
        ALTER TABLE case_indicator_states ADD COLUMN audit_type text NOT NULL DEFAULT 'initial';
    END IF;
END $$;

-- Update Unique Constraint / Primary Key to include audit_type
-- First, identifying the existing constraint name usually requires querying system catalogs, 
-- but we can try to drop the likely primary key or unique constraint.
-- Assuming standard naming or just dropping the constraint if we know it.
-- Instead, let's create a specific unique index which simpler to manage safely.

-- Ensure data uniqueness
ALTER TABLE case_indicator_states DROP CONSTRAINT IF EXISTS case_indicator_states_pkey;
ALTER TABLE case_indicator_states DROP CONSTRAINT IF EXISTS case_indicator_states_case_id_indicator_id_key;

-- Remove duplicates if any (just in case, keeping latest)
-- (Optional cleanup step ommitted for safety, assuming empty or consistent)

-- Make composite primary key
-- alter table case_indicator_states add primary key (case_id, indicator_id, audit_type);
-- OR unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_indicator_states_audit 
ON case_indicator_states (case_id, indicator_id, audit_type);

-- Also ensure policies allow access (RLS)
-- (Existing policies likely rely on case_id, so they should be fine)

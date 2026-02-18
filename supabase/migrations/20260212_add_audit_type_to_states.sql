-- Add audit_type column to case_indicator_states to track progress per audit cycle

ALTER TABLE public.case_indicator_states 
ADD COLUMN IF NOT EXISTS audit_type text NOT NULL DEFAULT 'initial';

-- Drop existing Primary Key
ALTER TABLE public.case_indicator_states 
DROP CONSTRAINT IF EXISTS case_indicator_states_pkey;

-- Create new Primary Key including audit_type
ALTER TABLE public.case_indicator_states 
ADD PRIMARY KEY (case_id, indicator_id, audit_type);

-- Update RLS policies if necessary (usually they are on case_id which is fine)
-- But ensuring we can insert for different audit_types

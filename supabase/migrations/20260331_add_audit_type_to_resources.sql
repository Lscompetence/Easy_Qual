
-- Migration to add audit_type to consultant_resources
ALTER TABLE IF EXISTS public.consultant_resources 
ADD COLUMN IF NOT EXISTS audit_type text DEFAULT 'initial' CHECK (audit_type IN ('initial', 'surveillance', 'renouvellement'));

-- Update the unique constraint to include audit_type
-- We need to find the name of the existing unique constraint first. 
-- In the previous migration it was defined inline as UNIQUE(consultant_id, indicator_id, resource_type)
-- Standard postgres name would be consultant_resources_consultant_id_indicator_id_resource_t_key

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultant_resources_consultant_id_indicator_id_resource_t_key') THEN
        ALTER TABLE public.consultant_resources DROP CONSTRAINT consultant_resources_consultant_id_indicator_id_resource_t_key;
    END IF;
END $$;

-- Add the new unique constraint
ALTER TABLE public.consultant_resources 
ADD CONSTRAINT consultant_resources_audit_key UNIQUE(consultant_id, indicator_id, resource_type, audit_type);

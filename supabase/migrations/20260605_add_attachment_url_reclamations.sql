-- Add attachment_url to reclamations table
ALTER TABLE public.reclamations ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Create reclamations bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('reclamations', 'reclamations', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the reclamations bucket
DROP POLICY IF EXISTS "Public can view reclamation attachments" ON storage.objects;
CREATE POLICY "Public can view reclamation attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reclamations');

DROP POLICY IF EXISTS "Authenticated users can upload reclamation attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload reclamation attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reclamations');

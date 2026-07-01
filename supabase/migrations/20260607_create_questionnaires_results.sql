-- Create the questionnaires_results table
CREATE TABLE IF NOT EXISTS public.questionnaires_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('client', 'consultant')),
    respondent_name TEXT NOT NULL,
    consultant_name TEXT,
    score NUMERIC,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.questionnaires_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert results (since it's a public form)
CREATE POLICY "Allow anonymous inserts"
    ON public.questionnaires_results FOR INSERT
    WITH CHECK (true);

-- Allow authenticated users (admin/consultant) to read results
CREATE POLICY "Allow authenticated read"
    ON public.questionnaires_results FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to update status
CREATE POLICY "Allow authenticated update"
    ON public.questionnaires_results FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Migration: Create reclamations table
CREATE TABLE IF NOT EXISTS public.reclamations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('reclamation', 'avis', 'bug')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reclamations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own complaints" ON public.reclamations;
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.reclamations;
DROP POLICY IF EXISTS "Admins can update complaints" ON public.reclamations;
DROP POLICY IF EXISTS "Admins can delete complaints" ON public.reclamations;

-- Policies:
-- 1. Anyone (authenticated) can insert their own complaints
CREATE POLICY "Users can insert their own complaints" 
ON public.reclamations 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. Users can view their own complaints, admins can see all
CREATE POLICY "Users can view their own complaints" 
ON public.reclamations 
FOR SELECT 
TO authenticated 
USING (
    auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 3. Admins can update/delete any complaints
CREATE POLICY "Admins can update complaints" 
ON public.reclamations 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can delete complaints" 
ON public.reclamations 
FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

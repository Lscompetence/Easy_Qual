-- Table pour stocker les audits Qualiopi complets (paramètres + grilles + réponses)
CREATE TABLE public.qualiopi_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultant_id UUID REFERENCES auth.users(id) NOT NULL,
    
    org_data JSONB DEFAULT '{}'::jsonb,
    cats JSONB DEFAULT '[]'::jsonb,
    types JSONB DEFAULT '[]'::jsonb,
    
    grilles JSONB DEFAULT '[]'::jsonb,
    grid_data JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de la sécurité (RLS)
ALTER TABLE public.qualiopi_audits ENABLE ROW LEVEL SECURITY;

-- Politique pour que le consultant ne voie et modifie que ses propres audits
CREATE POLICY "Consultants can manage their own audits" 
ON public.qualiopi_audits 
FOR ALL TO authenticated 
USING (auth.uid() = consultant_id) 
WITH CHECK (auth.uid() = consultant_id);

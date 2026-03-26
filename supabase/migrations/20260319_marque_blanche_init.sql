-- ==============================================================================
-- MIGRATION: MARQUE BLANCHE (SPRINT R3)
-- Description: Ajout de la table consultant_resources et du bucket consultant-assets
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CRÉATION DE LA TABLE SQL (Le Catalogue)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultant_resources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  consultant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  indicator_id bigint NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  resource_type text CHECK (resource_type IN ('video', 'document')),
  source_type text CHECK (source_type IN ('youtube', 'vimeo', 'upload', 'default')),
  url text,
  file_path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Contrainte: 1 seul fichier/lien par type (ex: 1 seule vidéo) pour 1 consultant sur 1 indicateur
  UNIQUE(consultant_id, indicator_id, resource_type)
);

-- ------------------------------------------------------------------------------
-- 2. POLITIQUES RLS SUR LA TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.consultant_resources ENABLE ROW LEVEL SECURITY;

-- Le consultant gère totalement SES ressources
CREATE POLICY "Consultants can manage their own resources" 
ON public.consultant_resources FOR ALL 
USING (consultant_id = auth.uid()) 
WITH CHECK (consultant_id = auth.uid());

-- Le client PEUT UNIQUEMENT LIRE les ressources du consultant de son dossier
CREATE POLICY "Clients can view their consultant's resources" 
ON public.consultant_resources FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cases c
    JOIN public.tenants t ON t.id = c.tenant_id
    WHERE t.owner_id = auth.uid() 
    AND t.created_by = consultant_resources.consultant_id
  )
);

-- ------------------------------------------------------------------------------
-- 3. CRÉATION DU BUCKET STORAGE (Le Disque Dur)
-- ------------------------------------------------------------------------------
-- Active l'extension si nécessaire (optionnel selon ton Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO storage.buckets (id, name, public) 
VALUES ('consultant-assets', 'consultant-assets', false)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. POLITIQUES DE SÉCURITÉ DU BUCKET (RLS sur storage.objects)
-- ------------------------------------------------------------------------------
-- Le dossier racine portera toujours l'ID du consultant : (storage.foldername(name))[1]

-- Accès complet (lecture, écriture, suppression) pour le consultant sur son propre dossier
CREATE POLICY "Consultant can manage their own assets" 
ON storage.objects FOR ALL 
USING (
  bucket_id = 'consultant-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Lecture autorisée pour les clients SUR le dossier de leur consultant
CREATE POLICY "Clients can view their consultant assets" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'consultant-assets' 
  AND EXISTS (
    SELECT 1 FROM public.cases c
    JOIN public.tenants t ON t.id = c.tenant_id
    WHERE t.owner_id = auth.uid() 
    AND t.created_by::text = (storage.foldername(name))[1]
  )
);

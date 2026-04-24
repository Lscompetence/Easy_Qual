-- Correction des politiques RLS pour permettre aux clients d'accéder aux ressources de leur consultant actuel
-- Même si ce n'est pas le consultant qui a créé le tenant à l'origine.

-- 1. Table consultant_resources
DROP POLICY IF EXISTS "Clients can view their consultant's resources" ON public.consultant_resources;
CREATE POLICY "Clients can view their consultant's resources" 
ON public.consultant_resources FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cases c
    JOIN public.tenants t ON t.id = c.tenant_id
    WHERE (t.owner_id = auth.uid() OR t.client_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND (
      t.created_by = consultant_resources.consultant_id 
      OR c.consultant_id = consultant_resources.consultant_id
    )
  )
);

-- 2. Bucket storage (consultant-assets)
DROP POLICY IF EXISTS "Clients can view their consultant assets" ON storage.objects;
CREATE POLICY "Clients can view their consultant assets" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'consultant-assets' 
  AND EXISTS (
    SELECT 1 FROM public.cases c
    JOIN public.tenants t ON t.id = c.tenant_id
    WHERE (t.owner_id = auth.uid() OR t.client_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND (
      t.created_by::text = (storage.foldername(name))[1]
      OR c.consultant_id::text = (storage.foldername(name))[1]
    )
  )
);

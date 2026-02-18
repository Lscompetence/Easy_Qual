-- 1. Supprimer les dossiers (cases) orphelins (dont le tenant n'a plus de créateur)
DELETE FROM public.cases
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE created_by IS NULL
);

-- 2. Supprimer les organismes (tenants) orphelins
-- Cela libérera les numéros SIRET utilisés par d'anciens consultants supprimés
DELETE FROM public.tenants
WHERE created_by IS NULL;

-- 3. (Optionnel) Si vous voulez précisément libérer le SIRET '123456789' s'il est encore bloqué
-- DELETE FROM public.tenants WHERE siret = '123456789';

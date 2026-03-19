-- ============================================================
-- FIX COMPLET: Affichage nom consultant dans session client
-- ============================================================

-- ─── ÉTAPE 1: Ajouter la colonne consultant_id si elle n'existe pas ─────────
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS consultant_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── ÉTAPE 2: Remplir consultant_id depuis tenants.created_by ────────────────
UPDATE public.cases c
SET consultant_id = t.created_by
FROM public.tenants t
WHERE c.tenant_id = t.id
  AND c.consultant_id IS NULL
  AND t.created_by IS NOT NULL;

-- ─── ÉTAPE 3: Vérification ─────────────────────────────────────────────────
SELECT
    c.id AS case_id,
    c.consultant_id,
    t.name AS tenant_name,
    t.created_by AS consultant_from_tenant
FROM public.cases c
JOIN public.tenants t ON t.id = c.tenant_id
ORDER BY c.created_at DESC;

-- ─── ÉTAPE 4: RLS sur profiles ─────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Clients can view their consultant profile" ON public.profiles;
CREATE POLICY "Clients can view their consultant profile"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.created_by = profiles.id AND t.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Consultants can view their clients profiles" ON public.profiles;
CREATE POLICY "Consultants can view their clients profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.owner_id = profiles.id AND t.created_by = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

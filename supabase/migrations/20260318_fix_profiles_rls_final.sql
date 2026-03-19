-- ============================================================
-- FIX ULTIME: Simplification stricte RLS Profiles
-- Date: 2026-03-18
-- ============================================================

-- Désactiver puis réactiver RLS pour nettoyer
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. DROP toutes les politiques existantes sur profiles pour être propre
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Clients can view their consultant profile" ON public.profiles;
DROP POLICY IF EXISTS "Consultants can view their clients profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 2. CREATE POLICY: Lecture globale pour tous les utilisateurs connectés
-- (Évite les problèmes complexes de sous-requêtes liées aux Tenants/Cases)
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 3. CREATE POLICY: Modification de son propre profil
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (id = auth.uid());

-- 4. CREATE POLICY: Admins peuvent tout faire
CREATE POLICY "Admins can manage all profiles" 
  ON public.profiles FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 5. S'assurer que les permissions de base sont accordées
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

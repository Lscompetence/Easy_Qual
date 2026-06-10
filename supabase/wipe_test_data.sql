-- ⚠️ ATTENTION : CE SCRIPT SUPPRIME TOUTES LES DONNÉES DE TEST DE VOTRE BASE DE DONNÉES.
-- IL VA RENDRE LA BASE ENTIÈREMENT VIERGE ET PRÊTE POUR LA PRODUCTION.
-- SEUL LE COMPTE ADMINISTRATEUR PRINCIPAL (devweb.lsc@outlook.com) SERA CONSERVÉ.

-- 1. Désactiver temporairement les contraintes pour vider les tables en toute sécurité
SET session_replication_role = 'replica';

-- 2. Vider toutes les tables opérationnelles contenant les données de test (dossiers, messages, preuves, etc.)
TRUNCATE TABLE public.case_events CASCADE;
TRUNCATE TABLE public.case_messages CASCADE;
TRUNCATE TABLE public.case_notifications CASCADE;
TRUNCATE TABLE public.case_indicator_states CASCADE;
TRUNCATE TABLE public.criterion_quiz_uploads CASCADE;
TRUNCATE TABLE public.consultant_resources CASCADE;
TRUNCATE TABLE public.admin_notifications CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.logs CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.evidences CASCADE;
TRUNCATE TABLE public.sessions CASCADE;
TRUNCATE TABLE public.cases CASCADE;
TRUNCATE TABLE public.tenants CASCADE;

-- 3. Nettoyer les portefeuilles de crédits (conserver uniquement celui de l'admin s'il existe)
DELETE FROM public.credits_wallet 
WHERE consultant_id NOT IN (
  SELECT id FROM public.profiles WHERE email = 'devweb.lsc@outlook.com'
);

-- 4. Supprimer tous les profils de test (consultants, clients) sauf l'admin principal
DELETE FROM public.profiles 
WHERE email != 'devweb.lsc@outlook.com' AND role != 'admin';

-- 5. Supprimer tous les comptes de connexion de Supabase Auth (emails/mots de passe) sauf l'admin
DELETE FROM auth.users 
WHERE email != 'devweb.lsc@outlook.com';

-- 6. Réactiver les contraintes de clés étrangères
SET session_replication_role = 'origin';

-- 🎉 Terminé ! Votre base de données est maintenant 100% vierge et prête pour accueillir vos vrais utilisateurs demain.

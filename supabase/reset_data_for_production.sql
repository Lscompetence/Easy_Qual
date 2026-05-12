-- ⚠️ ATTENTION : CE SCRIPT SUPPRIME TOUTES LES DONNÉES DE LA BASE DE DONNÉES
-- IL NE SUPPRIME PAS LES TABLES, JUSTE LE CONTENU.
-- À UTILISER UNIQUEMENT POUR NETTOYER LA BASE AVANT LE PASSAGE EN PRODUCTION OFFICIEL.

-- Désactiver temporairement les contraintes de clés étrangères (pour pouvoir vider les tables dans n'importe quel ordre)
SET session_replication_role = 'replica';

-- Vider toutes les tables de l'application
TRUNCATE TABLE case_events CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE cases CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE tenants CASCADE;

-- Optionnel : Vider les utilisateurs de l'authentification (Supabase Auth)
-- Décommentez les deux lignes ci-dessous si vous voulez AUSSI supprimer tous les comptes de connexion (emails/mots de passe)
-- TRUNCATE TABLE auth.users CASCADE;
-- TRUNCATE TABLE auth.identities CASCADE;

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = 'origin';

-- Terminé ! La base est maintenant aussi propre qu'au premier jour.

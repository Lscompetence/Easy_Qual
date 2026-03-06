-- Patch : Lier tous les dossiers "isolés" à leurs clients existants (ex: Yassine)
-- Ce script va chercher l'ID Auth de l'utilisateur basé sur son email et le lier au dossier
UPDATE public.tenants t
SET owner_id = u.id
FROM auth.users u
WHERE LOWER(t.client_email) = LOWER(u.email)
  AND t.owner_id IS NULL;

-- Autoriser les utilisateurs à supprimer leurs propres réclamations
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres réclamations"
ON public.reclamations
FOR DELETE
USING (auth.uid() = user_id);

-- Autoriser les administrateurs à supprimer n'importe quelle réclamation (si applicable)
-- CREATE POLICY "Les admins peuvent tout supprimer" ON public.reclamations FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

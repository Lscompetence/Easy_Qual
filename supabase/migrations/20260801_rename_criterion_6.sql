-- Update Criterion 6 label and description in the database
UPDATE public.criteria 
SET label = 'Investissement environnement', 
    description = 'Inscription et investissement du prestataire dans son environnement professionnel.' 
WHERE id = 6;

-- Migration to add temp_password to profiles
-- This stores the provisional password sent by the admin to the consultant
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS temp_password text;

-- Add a comment for clarity
COMMENT ON COLUMN public.profiles.temp_password IS 'Mot de passe provisoire généré par l''admin lors du provisioning';

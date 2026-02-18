-- Add is_active column to profiles table to control access/credits
ALTER TABLE public.profiles 
ADD COLUMN is_active boolean DEFAULT true;

-- Update RLS policies if necessary (Optional, as checking is_active in UI is often enough for "soft" disable, 
-- but for hard security we might want to prevent login. 
-- For now, we just stick to the requested "Disable Credit" feature).

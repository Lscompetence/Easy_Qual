-- Migration to add a utility to search for auth users by email and return their ID
CREATE OR REPLACE FUNCTION public.get_auth_user_id(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Search in auth.users (requires security definer and access to auth schema)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  RETURN v_user_id;
END;
$$;

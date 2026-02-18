-- Ensure the function is accessible to authenticated users
GRANT EXECUTE ON FUNCTION public.create_case_and_debit(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_case_and_debit(uuid, text, text, text) TO anon;

-- Re-verify that the function is security definer (it should be, but let's be sure)
ALTER FUNCTION public.create_case_and_debit(uuid, text, text, text) SECURITY DEFINER;

-- Just in case, grant access to the relevant tables to the postgres role 
-- (which security definer usually runs as)
GRANT ALL ON TABLE public.tenants TO postgres;
GRANT ALL ON TABLE public.cases TO postgres;
GRANT ALL ON TABLE public.credits_wallet TO postgres;
GRANT ALL ON TABLE public.transactions TO postgres;
GRANT ALL ON TABLE public.logs TO postgres;

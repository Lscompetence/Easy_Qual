
-- 1. Ensure credits_wallet table has RLS and correct permissions
ALTER TABLE public.credits_wallet ENABLE ROW LEVEL SECURITY;

-- 2. Allow consultants to view their own wallet
DROP POLICY IF EXISTS "Consultants can view their own wallet" ON public.credits_wallet;
CREATE POLICY "Consultants can view their own wallet"
ON public.credits_wallet FOR SELECT
USING (consultant_id = auth.uid());

-- 3. Update add_credits function to be more robust and security definer
CREATE OR REPLACE FUNCTION public.add_credits(p_consultant_id uuid, p_amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator permissions (postgres), bypassing RLS
AS $$
BEGIN
    INSERT INTO public.credits_wallet (consultant_id, balance, updated_at)
    VALUES (p_consultant_id, p_amount, now())
    ON CONFLICT (consultant_id)
    DO UPDATE SET 
        balance = public.credits_wallet.balance + p_amount,
        updated_at = now();
        
    -- Log the transaction
    INSERT INTO public.transactions (wallet_id, amount, transaction_type, description, created_at)
    VALUES (p_consultant_id, p_amount, 'recharge', 'Achat de crédits via pack en ligne', now());
END;
$$;

-- 4. Grant permissions to use the function
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, int) TO anon;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, int) TO service_role;

-- 5. Ensure transactions table is also accessible
GRANT ALL ON TABLE public.transactions TO postgres;
GRANT INSERT ON TABLE public.transactions TO authenticated;


-- 1. Table for Admin Notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    metadata jsonb, -- { consultant_id: 123, amount: 10, ... }
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. Permissions (Only Admin)
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all notifications" ON public.admin_notifications;
CREATE POLICY "Admins manage all notifications" ON public.admin_notifications
FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- 3. Update add_credits function to trigger notifications
CREATE OR REPLACE FUNCTION public.add_credits(p_consultant_id uuid, p_amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_consultant_name text;
BEGIN
    -- 1. Get consultant name for the notification
    SELECT COALESCE(first_name || ' ' || last_name, email) INTO v_consultant_name
    FROM public.profiles
    WHERE id = p_consultant_id;

    -- 2. Update/Insert Wallet
    IF EXISTS (SELECT 1 FROM public.credits_wallet WHERE consultant_id = p_consultant_id) THEN
        UPDATE public.credits_wallet
        SET balance = balance + p_amount,
            updated_at = now()
        WHERE consultant_id = p_consultant_id;
    ELSE
        INSERT INTO public.credits_wallet (consultant_id, balance, updated_at)
        VALUES (p_consultant_id, p_amount, now());
    END IF;

    -- 3. Log Transaction
    INSERT INTO public.transactions (wallet_id, amount, transaction_type, description, created_at)
    VALUES (p_consultant_id, p_amount, 'recharge', 'Achat de ' || p_amount || ' crédits', now());

    -- 4. Create Admin Notification
    INSERT INTO public.admin_notifications (title, content, type, metadata)
    VALUES (
        'Recharge de crédits - Pack choisi',
        'Le consultant ' || COALESCE(v_consultant_name, 'Inconnu') || ' a reçu un solde de ' || p_amount || ' crédits suite à son achat.',
        'success',
        jsonb_build_object('consultant_id', p_consultant_id, 'amount', p_amount)
    );
END;
$$;

-- 4. Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

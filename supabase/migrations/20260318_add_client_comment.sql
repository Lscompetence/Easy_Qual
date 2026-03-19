-- Migration pour ajouter client_comment à case_indicator_states s'il n'existe pas

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='case_indicator_states' AND column_name='client_comment') THEN
        ALTER TABLE public.case_indicator_states ADD COLUMN client_comment text;
    END IF;
END $$;

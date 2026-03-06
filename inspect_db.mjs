import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co'; // wait, I can just read it from .env

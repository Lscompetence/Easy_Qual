import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDb() {
    // Check latest uploads in criterion_quiz_uploads
    const { data: uploads } = await supabase.from('criterion_quiz_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(5);
    console.log("Recent quiz uploads:", JSON.stringify(uploads, null, 2));

    // Check recent indicator states
    const { data: states } = await supabase.from('case_indicator_states')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);
    console.log("Recent indicator states:", JSON.stringify(states, null, 2));
}

checkDb();

import { supabase } from '../src/supabaseClient.js';

async function checkDb() {
    const { data: states, error: sErr } = await supabase.from('case_indicator_states')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);
    console.log("Recent indicator states:", states);

    const { data: uploads, error: uErr } = await supabase.from('criterion_quiz_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(10);
    console.log("Recent quiz uploads:", uploads);
    
    process.exit(0);
}

checkDb();

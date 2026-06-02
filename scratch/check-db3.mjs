import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

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

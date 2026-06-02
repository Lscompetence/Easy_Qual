import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if (urlMatch && keyMatch) {
    const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());
    async function test() {
        const { data, error } = await supabase
            .from('case_events')
            .select(`
                id, title, event_date, visio_link, status,
                cases (
                    id, category,
                    tenants ( name )
                )
            `)
            .limit(5);
        if (error) console.error(error);
        console.log(JSON.stringify(data, null, 2));
    }
    test();
}

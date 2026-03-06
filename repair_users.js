const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8');
const urlLine = env.split('\n').find(l => l.startsWith('VITE_SUPABASE_URL='));
const keyLine = env.split('\n').find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='));

const url = urlLine.split('=')[1].trim();
const key = keyLine.split('=')[1].trim();

async function fixAll() {
    const supabase = createClient(url, key);

    // 1. Fetch all tenants
    const { data: tenants, error } = await supabase
        .from('tenants')
        .select('*')
        .not('client_email', 'is', null)
        .not('initial_password', 'is', null);

    if (error) {
        console.error('Error fetching tenants:', error);
        return;
    }

    console.log("Found " + tenants.length + " tenants with email & password.");

    // 2. Loop and hit invite-client for each
    for (const t of tenants) {
        if (t.client_email === 'd-nia@hotmail.fr') continue; // Skip admin/consultant just in case

        console.log("Processing: " + t.client_email + " / " + t.initial_password);

        try {
            const res = await fetch(url + '/functions/v1/invite-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + key
                },
                body: JSON.stringify({
                    email: t.client_email,
                    password: t.initial_password,
                    tenant_id: t.id,
                    tenant_name: t.name || 'Client'
                })
            });

            const text = await res.text();
            console.log("  -> Status: " + res.status + ", Body: " + text);
        } catch (e) {
            console.error("  -> Error: " + e.message);
        }
    }
}

fixAll();

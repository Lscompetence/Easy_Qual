import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        console.log("Checking all tenants for missing Auth accounts...");

        const { data: tenants, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .select('*')
            .neq('client_email', null);

        if (tenantError) throw tenantError;

        const results = [];

        // Fetch all users to avoid rate limit or excessive listing in loop
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 10000 });
        const usersMap = new Map((authUsers?.users || []).map(u => [u.email?.toLowerCase(), u]));

        for (const tenant of tenants) {
            const email = tenant.client_email?.toLowerCase();
            if (!email) continue;

            const existingUser = usersMap.get(email);
            const targetPassword = tenant.initial_password || 'Yassine12345';

            if (existingUser) {
                console.log(`Syncing existing user: ${email}`);
                const { error: syncErr } = await supabaseAdmin.auth.admin.updateUserById(
                    existingUser.id,
                    { password: targetPassword }
                );

                // Also ensures owner_id is set
                if (tenant.owner_id !== existingUser.id) {
                    await supabaseAdmin.from('tenants').update({ owner_id: existingUser.id }).eq('id', tenant.id);
                }

                results.push({ email, status: 'synced', error: syncErr?.message });
            } else {
                console.log(`Creating missing user: ${email}`);
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: targetPassword,
                    email_confirm: true,
                    user_metadata: {
                        role: 'of',
                        full_name: tenant.name,
                    }
                });

                if (newUser?.user) {
                    await supabaseAdmin.from('tenants').update({ owner_id: newUser.user.id }).eq('id', tenant.id);
                    results.push({ email, status: 'created' });
                } else {
                    results.push({ email, status: 'error', error: createError?.message });
                }
            }
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

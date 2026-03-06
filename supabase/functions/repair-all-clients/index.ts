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

        for (const tenant of tenants) {
            const email = tenant.client_email?.toLowerCase();
            if (!email) continue;

            const targetPassword = tenant.initial_password || '123456';

            console.log(`Processing ${email}...`);

            // Attempt to create. This is the fastest way to check existence + handle creation in one go.
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: targetPassword,
                email_confirm: true,
                user_metadata: { role: 'of', full_name: tenant.name }
            });

            if (createError) {
                if (createError.message?.includes('already been registered')) {
                    console.log(`User ${email} exists. Syncing password...`);

                    // Since it exists, we HUNT for the ID
                    let foundUser = null;
                    let page = 1;
                    // Exhaustive search (up to 50 pages / 50k users)
                    while (page <= 50) {
                        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
                        if (!listData?.users || listData.users.length === 0) break;
                        foundUser = listData.users.find((u: any) => u.email?.toLowerCase() === email);
                        if (foundUser) break;
                        page++;
                    }

                    if (foundUser) {
                        const { error: syncErr } = await supabaseAdmin.auth.admin.updateUserById(
                            foundUser.id,
                            { password: targetPassword }
                        );
                        await supabaseAdmin.from('tenants').update({ owner_id: foundUser.id }).eq('id', tenant.id);
                        results.push({ email, status: 'synced', id: foundUser.id, error: syncErr?.message });
                    } else {
                        results.push({ email, status: 'not_found_in_list', error: "Email registered but invisible in listing pages 1-50." });
                    }
                } else {
                    results.push({ email, status: 'error', error: createError.message });
                }
            } else if (newUser?.user) {
                await supabaseAdmin.from('tenants').update({ owner_id: newUser.user.id }).eq('id', tenant.id);
                results.push({ email, status: 'created', id: newUser.user.id });
            }
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

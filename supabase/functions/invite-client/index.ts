import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { email, password, tenant_id, tenant_name } = await req.json()
        if (!email || !password || !tenant_id) throw new Error('Missing email, password or tenant_id');

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        let userId;

        // 1. Try to create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'of', full_name: tenant_name }
        });

        if (createError) {
            // 2. If user already exists, find their ID via profiles table
            if (createError.message && createError.message.includes('already been registered')) {
                console.log(`User ${email} already registered. Searching for ID in profiles...`);

                const { data: profile, error: pErr } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .ilike('email', email)
                    .maybeSingle();

                if (profile) {
                    userId = profile.id;
                    console.log(`Found existing User ID: ${userId} via profile.`);

                    // Sync password!
                    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
                    if (updErr) throw new Error("Sync failed: " + updErr.message);
                } else {
                    // One last ditch attempt: find tenant with this email who might have the owner_id
                    const { data: tenant } = await supabaseAdmin.from('tenants').select('owner_id').eq('client_email', email).not('owner_id', 'is', null).limit(1).maybeSingle();
                    if (tenant?.owner_id) {
                        userId = tenant.owner_id;
                        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
                    } else {
                        throw new Error(`Le compte ${email} existe déjà dans le système d'accès mais n'a pas pu être lié à votre nouveau dossier. Veuillez contacter l'administrateur.`);
                    }
                }
            } else {
                throw createError;
            }
        } else {
            userId = newUser.user.id;
            console.log(`New user created: ${userId}`);
        }

        // 3. Link to Tenant
        console.log(`Linking tenant ${tenant_id} to owner ${userId}...`);
        const { error: tErr } = await supabaseAdmin.from('tenants').update({ owner_id: userId }).eq('id', tenant_id);
        if (tErr) console.error("Link error (non-blocking for login):", tErr.message);

        return new Response(JSON.stringify({ success: true, userId, message: "Accès client configuré avec succès." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error("Invite Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
})

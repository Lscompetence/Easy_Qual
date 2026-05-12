import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        let { email, password, tenant_id, tenant_name, first_name, last_name } = await req.json()

        // Nettoyage des entrées
        email = email?.trim()?.toLowerCase();
        tenant_name = tenant_name?.trim();
        first_name = first_name?.trim();
        last_name = last_name?.trim();

        console.log(`🚀 Start invite-client for: ${email}`);

        if (!email || !password || !tenant_id) {
            throw new Error('Champs manquants: email, mot de passe ou tenant_id');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

        if (!supabaseServiceKey) {
            console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");
            throw new Error("Configuration serveur incomplète (Service Key manquante).");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        let userId;

        // 1. Check if user already exists in auth.users using our RPC
        console.log(`🔍 Checking if user ${email} exists in Auth...`);
        const { data: existingUserId, error: rpcError } = await supabaseAdmin.rpc('get_auth_user_id', { p_email: email });

        if (rpcError) {
            console.warn("⚠️ RPC get_auth_user_id failed, falling back to createUser:", rpcError.message);
        }

        if (existingUserId) {
            userId = existingUserId;
            console.log(`✅ User found (ID: ${userId}). Syncing profile and password...`);

            const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: password,
                email_confirm: true,
                user_metadata: { role: 'of', full_name: tenant_name }
            });

            if (updErr) {
                console.error("❌ Failed to update user:", updErr.message);
                let customMsg = updErr.message;
                if (updErr.message.includes("short")) customMsg = "Le mot de passe est trop court. Supabase exige généralement 6 ou 8 caractères.";
                throw new Error(customMsg);
            }
        } else {
            // 2. Create new user
            console.log(`🆕 Creating new user for: ${email}`);
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { role: 'of', full_name: tenant_name }
            });

            if (createError) {
                console.error("❌ Error during user creation:", createError.message);
                let customMsg = createError.message;
                if (createError.message.includes("short")) {
                    customMsg = "Le mot de passe est trop court pour la politique de sécurité Supabase (min 6 ou 8 caractères).";
                }
                throw new Error(customMsg);
            }

            userId = newUser.user.id;
            console.log(`✅ New user created successfully (ID: ${userId})`);
        }

        // 3. Link to Tenant (Update owner_id)
        console.log(`🔗 Linking tenant ${tenant_id} to owner ${userId}...`);
        const { error: tErr } = await supabaseAdmin
            .from('tenants')
            .update({ owner_id: userId })
            .eq('id', tenant_id);

        if (tErr) {
            console.error("⚠️ Link error (non-blocking for login):", tErr.message);
        } else {
            console.log(`✅ Tenant linked successfully.`);
        }

        // 4. Update Profile with First/Last Name
        console.log(`👤 Updating profile for ${userId}...`);
        const { error: pErr } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                first_name: first_name || null,
                last_name: last_name || null,
                role: 'of'
            });
        
        if (pErr) console.error("⚠️ Profile sync error:", pErr.message);
        else console.log(`✅ Profile updated.`);

        return new Response(JSON.stringify({
            success: true,
            userId,
            message: existingUserId ? "Compte synchronisé" : "Compte créé avec succès"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error("🛑 INVITE CRASH:", error.message);
        return new Response(JSON.stringify({
            error: error.message,
            tip: error.message.includes("court")
                ? "Vérifiez la 'Minimum Password Length' dans Supabase > Auth > Settings."
                : "Assurez-vous que les variables d'environnement (SERVICE_ROLE_KEY) sont bien configurées."
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
})

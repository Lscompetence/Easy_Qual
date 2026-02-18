import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
}

Deno.serve(async (req) => {
    console.log(`[INIT] Function called: ${req.method}`)

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { action, userId, email, password, firstName, lastName, initialCredits, commercialName, siret, phone } = body
        console.log(`[REQ] Action: ${action}, Email: ${email || 'N/A'}, UserId: ${userId || 'N/A'}`)

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // --- 1. DELETE CONSULTANT (RESTORED) ---
        if (action === 'delete_user') {
            if (!userId) throw new Error('ID utilisateur manquant')
            console.log(`[DELETE] Starting full cleanup for: ${userId}`)

            // Database Cleanup
            await cleanupUserReferences(supabase, userId)

            // Auth Deletion
            const { error: authError } = await supabase.auth.admin.deleteUser(userId)
            if (authError) {
                console.error(`[AUTH_DELETE_ERROR] ${authError.message}`)
                throw authError
            }

            console.log(`[DELETE] Success for: ${userId}`)
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        // --- 2. CREATE CONSULTANT ---
        else if (action === 'create_consultant') {
            console.log(`[CREATE] 1. Auth Creation...`)
            const { data: userData, error: userError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { role: 'consultant', first_name: firstName, last_name: lastName }
            })

            if (userError) {
                console.error(`[AUTH_ERROR] ${userError.message}`)
                if (userError.message.includes('already registered')) {
                    return new Response(JSON.stringify({ success: false, error: "Cet email est déjà utilisé." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
                }
                throw userError
            }

            const newId = userData.user.id
            console.log(`[CREATE] 2. User Created: ${newId}`)

            // Wait for trigger
            await new Promise(r => setTimeout(r, 1000))

            console.log(`[CREATE] 3. Profile Update...`)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    commercial_name: commercialName,
                    siret: siret,
                    phone: phone,
                    temp_password: password
                })
                .eq('id', newId)

            if (profileError) {
                console.error(`[PROFILE_ERROR] ${profileError.message}`)
                return new Response(JSON.stringify({
                    success: false,
                    error: `Erreur base de données : ${profileError.message}. Avez-vous appliqué la migration SQL ?`
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
            }

            console.log(`[CREATE] 4. Wallet Update...`)
            if (initialCredits !== undefined) {
                await supabase.from('credits_wallet').update({ balance: initialCredits }).eq('consultant_id', newId)
            }

            console.log(`[CREATE] 5. SUCCESS`)
            return new Response(JSON.stringify({ success: true, user: userData.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
        }

        return new Response(JSON.stringify({ success: false, error: "Action non gérée" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } catch (err: any) {
        console.error(`[GLOBAL_ERROR] ${err.message}`)
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    }
})

// HELPER: Cleanup all DB references
async function cleanupUserReferences(supabase: any, userId: string) {
    console.log(`[CLEANUP] Cleaning up DB for: ${userId}`)
    try {
        // We delete in order of dependency if possible, or just nullify
        await Promise.allSettled([
            // Critical Change: Delete tenants (and thus cases via cascade)
            supabase.from('tenants').delete().eq('created_by', userId),
            // Cleanup other direct references
            supabase.from('logs').delete().eq('user_id', userId),
            supabase.from('reviews').delete().eq('reviewer_id', userId),
            supabase.from('transactions').delete().eq('wallet_id', userId),
            supabase.from('credits_wallet').delete().eq('consultant_id', userId),
            // Finally profile
            supabase.from('profiles').delete().eq('id', userId)
        ])
    } catch (e: any) {
        console.warn(`[CLEANUP] Warning during cleanup: ${e.message}`)
    }
}

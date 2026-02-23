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

// HELPER: Cleanup all DB references — ORDER MATTERS to avoid FK violations
async function cleanupUserReferences(supabase: any, userId: string) {
    console.log(`[CLEANUP] Cleaning up DB for: ${userId}`)
    try {
        // 1. Find all tenants created by this user
        const { data: tenants } = await supabase
            .from('tenants')
            .select('id')
            .eq('created_by', userId)

        const tenantIds = (tenants || []).map((t: any) => t.id)

        // 2. Find all cases for those tenants
        let caseIds: string[] = []
        if (tenantIds.length > 0) {
            const { data: cases } = await supabase
                .from('cases')
                .select('id')
                .in('tenant_id', tenantIds)
            caseIds = (cases || []).map((c: any) => c.id)
        }

        // 3. Delete case_messages (sender_id = userId OR case_id in caseIds)
        console.log(`[CLEANUP] Deleting case_messages for sender: ${userId} and ${caseIds.length} cases`)
        await supabase.from('case_messages').delete().eq('sender_id', userId)
        if (caseIds.length > 0) {
            await supabase.from('case_messages').delete().in('case_id', caseIds)
        }

        // 4. Delete case_events for those cases
        if (caseIds.length > 0) {
            console.log(`[CLEANUP] Deleting case_events for ${caseIds.length} cases`)
            await supabase.from('case_events').delete().in('case_id', caseIds)
        }

        // 5. Delete cases themselves
        if (caseIds.length > 0) {
            await supabase.from('cases').delete().in('id', caseIds)
        }

        // 6. Delete tenants
        if (tenantIds.length > 0) {
            await supabase.from('tenants').delete().in('id', tenantIds)
        }

        // 7. Cleanup other direct references (parallel is safe here)
        await Promise.allSettled([
            supabase.from('logs').delete().eq('user_id', userId),
            supabase.from('reviews').delete().eq('reviewer_id', userId),
            supabase.from('transactions').delete().eq('wallet_id', userId),
            supabase.from('credits_wallet').delete().eq('consultant_id', userId),
        ])

        // 8. Finally delete profile
        await supabase.from('profiles').delete().eq('id', userId)

        console.log(`[CLEANUP] All references cleaned for: ${userId}`)
    } catch (e: any) {
        console.warn(`[CLEANUP] Warning during cleanup: ${e.message}`)
    }
}

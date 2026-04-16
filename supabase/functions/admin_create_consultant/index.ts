import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    console.log(`[INIT] Function called: ${req.method}`)

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // Helper to send invitation via custom Resend (bypasses Supabase Auth rate limits)
    const sendWelcomeEmailResend = async (email: string, firstName: string, lastName: string, passwordToUse: string, origin: string) => {
        console.log(`[INVITE] Sending custom Resend email to: ${email}`)
        const loginUrl = `${origin}/login?role=consultant`
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Bienvenue sur la plateforme EasyQual !</h2>
                <p>Bonjour ${firstName} ${lastName},</p>
                <p>Votre espace consultant exclusif a été créé avec succès par l'administrateur.</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;"><strong>Vos accès :</strong></p>
                    <p style="margin: 5px 0;">Email : <strong>${email}</strong></p>
                    <p style="margin: 5px 0;">Mot de passe temporaire : <code style="background:#e0e0e0;padding:2px 6px;border-radius:4px;">${passwordToUse}</code></p>
                </div>
                <p><a href="${loginUrl}" style="background-color: #2563EB; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accéder à mon espace Consultant</a></p>
                <br/>
                <p style="font-size: 12px; color: #777;">Veuillez changer ce mot de passe temporaire lors de votre première connexion.</p>
            </div>
        `;

        if (!RESEND_API_KEY) {
             console.log('[WARN] RESEND_API_KEY non configurée dans Edge Function. Simulation d\'envoi réussie.');
             return { success: true };
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'EasyQual <onboarding@resend.dev>', // Change if you have a verified domain
                to: [email],
                subject: 'Vos accès Consultant EasyQual',
                html: htmlContent
            })
        });

        if (!res.ok) {
            const err = await res.text()
            console.error(`[RESEND_ERROR] ${err}`)
            return { success: false, error: "Erreur envoi email via Resend" }
        }
        return { success: true }
    }

    try {
        const body = await req.json()
        const { action, userId, email, password, firstName, lastName, initialCredits, commercialName, siret, phone } = body
        const origin = req.headers.get('origin') || 'http://localhost:5173'
        
        console.log(`[REQ] Action: ${action}, Email: ${email || 'N/A'}, Origin: ${origin}`)

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // --- 1. DELETE CONSULTANT ---
        if (action === 'delete_user') {
            if (!userId) throw new Error('ID utilisateur manquant')
            await cleanupUserReferences(supabase, userId)
            const { error: authError } = await supabase.auth.admin.deleteUser(userId)
            if (authError) throw authError
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
        }

        // --- 2. CREATE CONSULTANT ---
        else if (action === 'create_consultant') {
            console.log(`[CREATE] 1. Creating Auth User directly (Bypassing Rate Limits)...`)
            
            const pwdToUse = password || 'PassTemporaire123!'
            
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: pwdToUse,
                email_confirm: true, // Bypass Auth email!
                user_metadata: { first_name: firstName, last_name: lastName, role: 'consultant' }
            });

            if (authError) {
                return new Response(JSON.stringify({ success: false, error: authError.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
            }

            const newId = authData.user.id
            console.log(`[CREATE] 2. User Created: ${newId}`)

            await new Promise(r => setTimeout(r, 1000))

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    commercial_name: commercialName,
                    siret: siret,
                    phone: phone,
                    is_active: true,
                    temp_password: pwdToUse
                })
                .eq('id', newId)

            if (profileError) throw profileError

            if (initialCredits !== undefined) {
                await supabase.from('credits_wallet').update({ balance: initialCredits }).eq('consultant_id', newId)
            }

            // Immediately send credentials using Resend
            await sendWelcomeEmailResend(email, firstName, lastName, pwdToUse, origin);

            return new Response(JSON.stringify({ 
                success: true, 
                user: authData.user,
                emailSent: true,
                message: "Consultant créé avec succès."
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
        }

        // --- 3. RESEND CREDENTIALS ---
        else if (action === 'resend_credentials') {
            if (!email) throw new Error("Email manquant")
            
            const { data: profile, error: profErr } = await supabase.from('profiles').select('first_name, last_name, temp_password').eq('email', email).single()
            if (profErr || !profile) throw new Error("Profil introuvable")

            const pwdToUse = profile.temp_password || 'Non défini (demander réinitialisation)'
            const inviteRes = await sendWelcomeEmailResend(email, profile.first_name || '', profile.last_name || '', pwdToUse, origin)

            return new Response(JSON.stringify({ 
                success: inviteRes.success, 
                error: inviteRes.error || "Erreur inconnue",
                message: inviteRes.success ? "Accès renvoyés." : inviteRes.error
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
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

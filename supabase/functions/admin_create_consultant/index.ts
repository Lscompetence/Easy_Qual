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

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')

    // Helper to send invitation via Brevo (formerly Sendinblue)
    const sendWelcomeEmailBrevo = async (email: string, firstName: string, lastName: string, passwordToUse: string, origin: string) => {
        console.log(`[INVITE] Sending Brevo email to: ${email}`)
        const loginUrl = `${origin}/login?role=consultant`
        const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f9f9fb; }
                    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eef0f2; }
                    .header { padding: 40px 20px; text-align: center; border-bottom: 1px solid #f0f0f0; }
                    .logo { font-size: 28px; font-weight: 800; color: #0f172a; text-decoration: none; letter-spacing: -1px; }
                    .logo span { color: #2563eb; }
                    .content { padding: 40px 50px; }
                    .welcome { font-size: 24px; font-weight: 700; margin-bottom: 10px; color: #111827; }
                    .intro { font-size: 15px; color: #4b5563; margin-bottom: 30px; font-weight: 300; }
                    .card { background-color: #f8fafc; border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; }
                    .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 700; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
                    .field { margin-bottom: 15px; font-size: 14px; }
                    .field strong { color: #64748b; width: 100px; display: inline-block; font-size: 12px; }
                    .field span { color: #1e293b; font-weight: 600; }
                    .password-box { background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 16px; color: #2563eb; }
                    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 18px 35px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 20px; text-align: center; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
                    .footer { background-color: #0f172a; color: #94a3b8; padding: 50px; text-align: center; font-size: 13px; }
                    .footer p { margin: 8px 0; font-weight: 300; }
                    .footer a { color: #ffffff; text-decoration: none; font-weight: 600; }
                    .meta { display: block; font-size: 10px; color: #94a3b8; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="header">
                        <div class="logo">Easy<span>'</span>Qual</div>
                    </div>
                    <div class="content">
                        <div class="meta">
                            RÉF : ACC-CONSULTANT &nbsp; | &nbsp; ${dateStr}
                        </div>
                        <h1 class="welcome">Bienvenue, ${firstName} !</h1>
                        <p class="intro">Votre espace professionnel EasyQual est prêt. Vous pouvez dès à présent piloter vos audits et accompagner vos clients vers la réussite Qualiopi.</p>
                        
                        <div class="card">
                            <div class="card-title">Fiche d'accès sécurisée</div>
                            <div class="field"><strong>EMAIL</strong> <span>${email}</span></div>
                            <div class="field"><strong>PASSWORD</strong> <span class="password-box">${passwordToUse}</span></div>
                        </div>

                        <div style="text-align: center;">
                            <a href="${loginUrl}" class="btn">Accéder à mon tableau de bord</a>
                        </div>
                        
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 45px; text-align: center; font-weight: 300;">
                            Pour votre sécurité, ce mot de passe temporaire doit être modifié lors de votre première connexion dans l'onglet "Profil".
                        </p>
                    </div>
                    <div class="footer">
                        <div class="logo" style="color: #ffffff; margin-bottom: 25px; font-size: 24px;">Easy<span>'</span>Qual</div>
                        <p>L'excellence opérationnelle pour votre certification Qualiopi.</p>
                        <p>Une question ? <a href="mailto:yassinealaoui095@gmail.com">Contactez notre support</a></p>
                        <p style="margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 25px; font-size: 10px; opacity: 0.6;">
                            © 2026 EasyQual. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        if (!BREVO_API_KEY) {
             console.log('[WARN] BREVO_API_KEY non configurée. Identifiants affichés en secours.');
             return { success: false, error: "Clé API Brevo manquante dans la configuration." };
        }

        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 
                'api-key': BREVO_API_KEY, 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: 'EasyQual', email: 'yassinealaoui095@gmail.com' }, 
                to: [{ email: email, name: `${firstName} ${lastName}` }],
                subject: 'Vos accès Consultant EasyQual',
                htmlContent: htmlContent
            })
        });

        if (!res.ok) {
            const err = await res.text()
            console.error(`[BREVO_ERROR] ${err}`)
            return { success: false, error: "Erreur envoi email via Brevo" }
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

            // Immediately send credentials using Brevo
            await sendWelcomeEmailBrevo(email, firstName, lastName, pwdToUse, origin);

            return new Response(JSON.stringify({ 
                success: true, 
                user: authData.user,
                emailSent: true,
                message: "Consultant créé avec succès."
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
        }

        // --- 3. RESEND CREDENTIALS (Email only) ---
        else if (action === 'resend_credentials') {
            console.log(`[RESEND] Attempting to resend credentials to: ${email}`)
            if (!email) throw new Error("Email manquant")
            
            // Fetch profile data including names and temp password
            const { data: profile, error: profErr } = await supabase
                .from('profiles')
                .select('first_name, last_name, temp_password')
                .eq('email', email)
                .maybeSingle()

            if (profErr) {
                console.error(`[RESEND_ERROR] Database error: ${profErr.message}`)
                throw new Error(`Erreur base de données : ${profErr.message}`)
            }

            if (!profile) {
                console.error(`[RESEND_ERROR] Profile not found for: ${email}`)
                throw new Error("Profil introuvable dans la base de données.")
            }

            const pwdToUse = profile.temp_password || 'Non défini (contactez l\'administrateur)'
            console.log(`[RESEND] Profile found. Sending email via Resend...`)

            const inviteRes = await sendWelcomeEmailBrevo(
                email, 
                profile.first_name || 'Consultant', 
                profile.last_name || '', 
                pwdToUse, 
                origin
            )

            if (!inviteRes.success) {
                console.error(`[RESEND_ERROR] ${inviteRes.error}`)
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: inviteRes.error || "L'envoi de l'email a échoué." 
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
            }

            console.log(`[RESEND] Success! Email sent to ${email}`)
            return new Response(JSON.stringify({ 
                success: true, 
                message: "Les accès ont été renvoyés avec succès."
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

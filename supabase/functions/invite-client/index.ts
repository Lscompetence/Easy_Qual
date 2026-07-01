import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

const extractErrorMessage = (err: any): string => {
    if (!err) return "Erreur inconnue";
    if (typeof err === 'string') return err;
    
    // Extract non-enumerable properties from Error
    const props = Object.getOwnPropertyNames(err);
    if (props.includes('message') && err.message) {
        return String(err.message);
    }
    
    // Fallback to serialization
    const detailObj: any = {};
    for (const prop of props) {
        detailObj[prop] = err[prop];
    }
    const str = JSON.stringify(detailObj);
    if (str === '{}') {
        return String(err);
    }
    return str;
}

const sendWelcomeEmailBrevo = async (
    email: string,
    tenantName: string,
    firstName: string,
    lastName: string,
    passwordToUse: string,
    origin: string,
    apiKey: string
) => {
    console.log(`[INVITE] Sending Brevo email to client: ${email}`)
    const loginUrl = `${origin}/login`
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const nameDisplay = firstName ? firstName : tenantName;

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
                .logo span { color: #8b5cf6; }
                .content { padding: 40px 50px; }
                .welcome { font-size: 24px; font-weight: 700; margin-bottom: 10px; color: #111827; }
                .intro { font-size: 15px; color: #4b5563; margin-bottom: 30px; font-weight: 300; }
                .card { background-color: #f8fafc; border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; }
                .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 700; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
                .field { margin-bottom: 15px; font-size: 14px; }
                .field strong { color: #64748b; width: 100px; display: inline-block; font-size: 12px; }
                .field span { color: #1e293b; font-weight: 600; }
                .password-box { background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 16px; color: #8b5cf6; }
                .btn { display: inline-block; background-color: #8b5cf6; color: #ffffff !important; padding: 18px 35px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 20px; text-align: center; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.2); }
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
                        RÉF : ACC-CLIENT &nbsp; | &nbsp; ${dateStr}
                    </div>
                    <h1 class="welcome">Bienvenue, ${nameDisplay} !</h1>
                    <p class="intro">Votre espace d'accompagnement EasyQual est prêt. Vous pouvez dès à présent suivre votre progression, déposer vos éléments de preuve et collaborer avec votre consultant.</p>
                    
                    <div class="card">
                        <div class="card-title">Fiche d'accès sécurisée</div>
                        <div class="field"><strong>EMAIL</strong> <span>${email}</span></div>
                        <div class="field"><strong>PASSWORD</strong> <span class="password-box">${passwordToUse}</span></div>
                    </div>

                    <div style="text-align: center;">
                        <a href="${loginUrl}" class="btn">Accéder à mon espace client</a>
                    </div>
                    
                    <p style="font-size: 12px; color: #94a3b8; margin-top: 45px; text-align: center; font-weight: 300;">
                        Pour votre sécurité, ce mot de passe temporaire doit être modifié lors de votre première connexion dans l'onglet "Profil".
                    </p>
                </div>
                <div class="footer">
                    <div class="logo" style="color: #ffffff; margin-bottom: 25px; font-size: 24px;">Easy<span>'</span>Qual</div>
                    <p>L'excellence opérationnelle pour votre certification Qualiopi.</p>
                    <p>Une question ? <a href="mailto:devweb.lsc@outlook.com">Contactez notre support</a></p>
                    <p style="margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 25px; font-size: 10px; opacity: 0.6;">
                        © 2026 EasyQual. Tous droits réservés.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 
            'api-key': apiKey, 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: 'EasyQual', email: 'yassinealaoui095@gmail.com' }, 
            to: [{ email: email, name: firstName || lastName ? `${firstName} ${lastName}`.trim() : tenantName }],
            subject: 'Vos accès Client EasyQual',
            htmlContent: htmlContent
        })
    });
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

const extractErrorMessage = (err: any): string => {
    if (!err) return "Erreur inconnue";
    if (typeof err === 'string') return err;
    
    // Extract non-enumerable properties from Error
    const props = Object.getOwnPropertyNames(err);
    if (props.includes('message') && err.message) {
        return String(err.message);
    }
    
    // Fallback to serialization
    const detailObj: any = {};
    for (const prop of props) {
        detailObj[prop] = err[prop];
    }
    const str = JSON.stringify(detailObj);
    if (str === '{}') {
        return String(err);
    }
    return str;
}

const sendWelcomeEmailBrevo = async (
    email: string,
    tenantName: string,
    firstName: string,
    lastName: string,
    passwordToUse: string,
    origin: string,
    apiKey: string
) => {
    console.log(`[INVITE] Sending Brevo email to client: ${email}`)
    const loginUrl = `${origin}/login`
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const nameDisplay = firstName ? firstName : tenantName;

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
                .logo span { color: #8b5cf6; }
                .content { padding: 40px 50px; }
                .welcome { font-size: 24px; font-weight: 700; margin-bottom: 10px; color: #111827; }
                .intro { font-size: 15px; color: #4b5563; margin-bottom: 30px; font-weight: 300; }
                .card { background-color: #f8fafc; border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; }
                .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 700; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
                .field { margin-bottom: 15px; font-size: 14px; }
                .field strong { color: #64748b; width: 100px; display: inline-block; font-size: 12px; }
                .field span { color: #1e293b; font-weight: 600; }
                .password-box { background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 16px; color: #8b5cf6; }
                .btn { display: inline-block; background-color: #8b5cf6; color: #ffffff !important; padding: 18px 35px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 20px; text-align: center; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.2); }
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
                        RÉF : ACC-CLIENT &nbsp; | &nbsp; ${dateStr}
                    </div>
                    <h1 class="welcome">Bienvenue, ${nameDisplay} !</h1>
                    <p class="intro">Votre espace d'accompagnement EasyQual est prêt. Vous pouvez dès à présent suivre votre progression, déposer vos éléments de preuve et collaborer avec votre consultant.</p>
                    
                    <div class="card">
                        <div class="card-title">Fiche d'accès sécurisée</div>
                        <div class="field"><strong>EMAIL</strong> <span>${email}</span></div>
                        <div class="field"><strong>PASSWORD</strong> <span class="password-box">${passwordToUse}</span></div>
                    </div>

                    <div style="text-align: center;">
                        <a href="${loginUrl}" class="btn">Accéder à mon espace client</a>
                    </div>
                    
                    <p style="font-size: 12px; color: #94a3b8; margin-top: 45px; text-align: center; font-weight: 300;">
                        Pour votre sécurité, ce mot de passe temporaire doit être modifié lors de votre première connexion dans l'onglet "Profil".
                    </p>
                </div>
                <div class="footer">
                    <div class="logo" style="color: #ffffff; margin-bottom: 25px; font-size: 24px;">Easy<span>'</span>Qual</div>
                    <p>L'excellence opérationnelle pour votre certification Qualiopi.</p>
                    <p>Une question ? <a href="mailto:devweb.lsc@outlook.com">Contactez notre support</a></p>
                    <p style="margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 25px; font-size: 10px; opacity: 0.6;">
                        © 2026 EasyQual. Tous droits réservés.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 
            'api-key': apiKey, 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: 'EasyQual', email: 'yassinealaoui095@gmail.com' }, 
            to: [{ email: email, name: firstName || lastName ? `${firstName} ${lastName}`.trim() : tenantName }],
            subject: 'Vos accès Client EasyQual',
            htmlContent: htmlContent
        })
    });

    if (!res.ok) {
        const err = await res.text();
        console.error(`[BREVO_ERROR] ${err}`);
        return { success: false, error: "Erreur envoi email via Brevo" };
    }
    return { success: true };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const debugLogs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        debugLogs.push(msg);
    };

    try {
        let { email, password, tenant_id, tenant_name, first_name, last_name } = await req.json()

        // Nettoyage des entrées
        email = email?.trim()?.toLowerCase();
        tenant_name = tenant_name?.trim();
        first_name = first_name?.trim();
        last_name = last_name?.trim();

        log(`🚀 Start invite-client for: ${email}`);

        if (!email || !password || !tenant_id) {
            throw new Error('Champs manquants: email, mot de passe ou tenant_id');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

        log(`Supabase URL: ${supabaseUrl}`);
        log(`Supabase Key Prefix: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 10) : 'MISSING'}`);

        if (!supabaseServiceKey) {
            throw new Error("Configuration serveur incomplète (Service Key manquante).");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        let userId;

        // 1. Check if user already exists in auth.users using our RPC
        log(`🔍 Checking if user ${email} exists in Auth...`);
        const { data: existingUserId, error: rpcError } = await supabaseAdmin.rpc('get_auth_user_id', { p_email: email });

        if (rpcError) {
            log(`⚠️ RPC get_auth_user_id failed: ${rpcError.message}`);
        } else {
            log(`RPC result: ${existingUserId}`);
        }

        if (existingUserId) {
            userId = existingUserId;
            log(`✅ User found (ID: ${userId}). Syncing profile and password...`);

            const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: password,
                email_confirm: true,
                user_metadata: { role: 'of', full_name: tenant_name }
            });

            if (updErr) {
                log(`❌ Failed to update user error: ${JSON.stringify(updErr)}`);
                const customMsg = extractErrorMessage(updErr);
                throw new Error(customMsg);
            }
        } else {
            // 2. Create new user
            log(`🆕 Creating new user for: ${email}`);
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { role: 'of', full_name: tenant_name }
            });

            if (createError) {
                log(`❌ Error during user creation detail: ${JSON.stringify(createError)}`);
                const customMsg = extractErrorMessage(createError);
                throw new Error(customMsg);
            }

            userId = newUser.user.id;
            log(`✅ New user created successfully (ID: ${userId})`);
        }

        // 3. Link to Tenant (Update owner_id)
        log(`🔗 Linking tenant ${tenant_id} to owner ${userId}...`);
        const { error: tErr } = await supabaseAdmin
            .from('tenants')
            .update({ owner_id: userId })
            .eq('id', tenant_id);

        if (tErr) {
            log(`⚠️ Link error (non-blocking for login): ${tErr.message}`);
        } else {
            log(`✅ Tenant linked successfully.`);
        }

        // 4. Update Profile with First/Last Name
        log(`👤 Updating profile for ${userId}...`);
        const { error: pErr } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                first_name: first_name || null,
                last_name: last_name || null,
                role: 'of'
            });
        
        if (pErr) log(`⚠️ Profile sync error: ${pErr.message}`);
        else log(`✅ Profile updated.`);

        // Fetch name from profiles table if empty (for resend credentials scenario)
        if (!first_name || !last_name) {
            const { data: profData } = await supabaseAdmin
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', userId)
                .maybeSingle();
            
            if (profData) {
                first_name = first_name || profData.first_name;
                last_name = last_name || profData.last_name;
            }
        }

        // 5. Send Welcome Email via Brevo
        const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
        const origin = req.headers.get('origin') || 'http://localhost:5173';
        
        let emailSent = false;
        if (BREVO_API_KEY) {
            log(`📧 Sending email via Brevo...`);
            const emailRes = await sendWelcomeEmailBrevo(
                email,
                tenant_name || 'Votre entreprise',
                first_name || '',
                last_name || '',
                password,
                origin,
                BREVO_API_KEY
            );
            emailSent = emailRes.success;
            log(`Email sent status: ${emailSent}`);
        } else {
            log("⚠️ BREVO_API_KEY missing in environment variables. Email was not sent.");
        }

        return new Response(JSON.stringify({
            success: true,
            userId,
            emailSent,
            debugLogs,
            message: existingUserId ? "Compte synchronisé et accès envoyés" : "Compte créé et accès envoyés avec succès"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        log(`🛑 INVITE CRASH: ${error}`);
        const errorMsg = extractErrorMessage(error);
        
        return new Response(JSON.stringify({
            error: errorMsg,
            debugLogs,
            tip: errorMsg.includes("court")
                ? "Vérifiez la 'Minimum Password Length' dans Supabase > Auth > Settings."
                : "Assurez-vous que les variables d'environnement (SERVICE_ROLE_KEY) sont bien configurées."
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
})

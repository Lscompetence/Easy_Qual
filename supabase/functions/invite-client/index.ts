import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment variables
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS FIRST, and aggressively
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Test logging to see if function starts
        console.log("Function invite-client started for method: ", req.method);
        // 1. Parse Input
        const { email, password, tenant_id, tenant_name } = await req.json()

        if (!email || !tenant_id) {
            throw new Error('Email et Tenant ID sont obligatoires')
        }

        // 2. Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !serviceRoleKey) {
            console.error("Missing Supabase configuration");
            throw new Error("Erreur de configuration serveur (Clés manquantes)");
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        // 3. Robustly check if user already exists across all pages
        let existingUser = null;
        let page = 1;
        while (true) {
            const { data: pageData, error: pageError } = await supabaseAdmin.auth.admin.listUsers({
                page: page,
                perPage: 1000
            });
            if (pageError || !pageData || !pageData.users || pageData.users.length === 0) break;
            existingUser = pageData.users.find((u: any) => u.email === email);
            if (existingUser) break;
            page++;
        }

        let userId
        let tempPassword = password
        let isNewUser = false

        if (existingUser) {
            userId = existingUser.id
            console.log(`User found via listUsers: ${email} (${userId}). Synchronizing...`)
        } else {
            // 4. Try to create new user
            isNewUser = true
            console.log(`Creating new user: ${email}`)
            if (!tempPassword) {
                tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
            }

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    role: 'of',
                    full_name: tenant_name || 'Client',
                }
            })

            if (createError) {
                if (createError.message && createError.message.includes('already been registered')) {
                    console.log(`User already exists but listUsers missed it. Hunting...`)
                    // Fallback: search again or try to get ID from profiles if you have a trigger, 
                    // or just return success with instructions. 
                    // BUT let's try one last listUsers specifically if it failed before.

                    // If we are here, isNewUser is false now
                    isNewUser = false
                    const { data: huntData } = await supabaseAdmin.auth.admin.listUsers()
                    const hunted = huntData?.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())
                    if (hunted) {
                        userId = hunted.id
                        console.log(`Hunter found: ${userId}`)
                    } else {
                        // Still didn't find? Return success but warn
                        return new Response(
                            JSON.stringify({
                                success: true,
                                message: "Compte existant. Veuillez utiliser votre mot de passe habituel."
                            }),
                            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                        )
                    }
                } else {
                    throw createError
                }
            } else {
                userId = newUser.user.id
            }
        }

        // 5. If we have a userId, let's SYNC the password (important for Repair Access)
        if (userId && tempPassword) {
            console.log(`Final sync for ${userId}...`)
            const { error: syncError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: tempPassword }
            )
            if (syncError) console.error('Sync error (non-blocking):', syncError)
        }

        // 5. Link User to Tenant (Update owner_id)
        const { error: updateError } = await supabaseAdmin
            .from('tenants')
            .update({ owner_id: userId })
            .eq('id', tenant_id)

        if (updateError) throw updateError

        // 6. Send Email (Only if new user with temp password, or maybe notify existing?)
        // Requirement implies sending credentials.
        if (isNewUser && tempPassword) {
            if (!RESEND_API_KEY) {
                console.error('RESEND_API_KEY missing')
                // Don't fail the whole request, but return warning
            } else {
                const loginUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/login?role=client`

                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: "Easy'Qual <onboarding@resend.dev>",
                        to: [email],
                        subject: "Bienvenue sur Easy'Qual - Vos identifiants",
                        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #7c3aed;">Bienvenue ${tenant_name},</h2>
                    <p>Votre consultant vient de créer votre dossier Qualiopi sur Easy'Qual.</p>
                    <p>Voici vos identifiants pour accéder à votre espace client :</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 10px 0;"><strong>🔗 Lien de connexion :</strong> <a href="${loginUrl}" style="color: #7c3aed;">${loginUrl}</a></p>
                    <p style="margin: 10px 0;"><strong>📧 Email :</strong> ${email}</p>
                    <p style="margin: 10px 0;"><strong>🔑 Mot de passe provisoire :</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
                    </div>
                    
                    <p>Nous vous conseillons de changer ce mot de passe dès votre première connexion.</p>
                    <p>Cordialement,<br/><strong>L'équipe Easy'Qual</strong></p>
                </div>
                `,
                    }),
                })

                if (!res.ok) {
                    const errorData = await res.json()
                    console.error('Resend Error:', errorData)
                    // throwing here might be too aggressive if user is created? 
                    // Better to return partial success
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                userId,
                isNewUser,
                message: isNewUser ? 'Utilisateur créé et invité' : 'Utilisateur existant lié au dossier'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})

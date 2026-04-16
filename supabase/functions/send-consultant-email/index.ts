import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const { firstName, lastName, email, tempPassword, loginUrl } = await req.json()

        // Validate required fields
        if (!firstName || !lastName || !email || !tempPassword || !loginUrl) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Send email via Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: Deno.env.get('RESEND_FROM_EMAIL') || 'Easy\'Qual <onboarding@resend.dev>', // Change this to your verified domain
                to: [email],
                subject: 'Vos identifiants de connexion Easy\'Qual',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Bonjour ${firstName} ${lastName},</h2>
            <p>Voici vos identifiants pour accéder à la plateforme Easy'Qual :</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>🔗 Lien de connexion :</strong></p>
              <p style="margin: 10px 0;"><a href="${loginUrl}" style="color: #2563eb; text-decoration: none;">${loginUrl}</a></p>
              <p style="margin: 10px 0;"><strong>📧 Email :</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>🔑 Mot de passe provisoire :</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
            </div>
            <p>Cordialement,<br/><strong>L'équipe Easy'Qual</strong></p>
          </div>
        `,
            }),
        })

        const data = await res.json()

        if (res.ok) {
            return new Response(
                JSON.stringify({ success: true, data }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    }
                }
            )
        } else {
            return new Response(
                JSON.stringify({ error: 'Failed to send email', details: data }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    }
                }
            )
        }
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                }
            }
        )
    }
})

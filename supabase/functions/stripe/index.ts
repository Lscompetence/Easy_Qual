import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import Stripe from "https://esm.sh/stripe@14.19.0?target=deno"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    if (!STRIPE_SECRET_KEY) {
        console.error("[STRIPE_ERROR] STRIPE_SECRET_KEY is not set.")
        return new Response(JSON.stringify({ error: "Configuration server error." }), { status: 500, headers: corsHeaders })
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
    })

    const signature = req.headers.get("stripe-signature")

    // --- CASE A: Stripe Webhook ---
    if (signature) {
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
        if (!webhookSecret) {
            console.error("[STRIPE_ERROR] STRIPE_WEBHOOK_SECRET is not set.")
            return new Response(JSON.stringify({ error: "Webhook secret missing." }), { status: 500, headers: corsHeaders })
        }

        try {
            const bodyText = await req.text()
            const event = await stripe.webhooks.constructEventAsync(
                bodyText,
                signature,
                webhookSecret
            )

            console.log(`[STRIPE_WEBHOOK] Received event: ${event.type}`)

            if (event.type === 'checkout.session.completed') {
                const session = event.data.object as Stripe.Checkout.Session
                const consultantId = session.client_reference_id
                const credits = session.metadata?.credits

                if (!consultantId || !credits) {
                    console.error("[STRIPE_WEBHOOK_ERROR] Missing client_reference_id or credits in metadata.", session)
                    return new Response(JSON.stringify({ error: "Metadata missing." }), { status: 400, headers: corsHeaders })
                }

                console.log(`[STRIPE_WEBHOOK] Payment successful for consultant ${consultantId}. Crediting ${credits} credits.`)

                // Initialize Admin Supabase Client to bypass RLS
                const supabase = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
                    { auth: { autoRefreshToken: false, persistSession: false } }
                )

                // Call add_credits RPC function
                const { error: rpcError } = await supabase.rpc('add_credits', {
                    p_consultant_id: consultantId,
                    p_amount: parseInt(credits, 10)
                })

                if (rpcError) {
                    console.error(`[STRIPE_WEBHOOK_ERROR] Failed to run add_credits RPC:`, rpcError)
                    throw rpcError
                }

                console.log(`[STRIPE_WEBHOOK] Credits successfully added to wallet.`)
            }

            return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        } catch (err: any) {
            console.error(`[STRIPE_WEBHOOK_ERROR] Webhook processing failed: ${err.message}`)
            return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders })
        }
    }

    // --- CASE B: Client Checkout Session Creation ---
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header." }), { status: 401, headers: corsHeaders })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('VITE_SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        // Validate JWT token
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error(`[STRIPE_AUTH_ERROR] Invalid user JWT: ${authError?.message}`)
            return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers: corsHeaders })
        }

        const body = await req.json()
        const { packId, customQuantity } = body

        let quantity = 0
        let packName = "Achat de crédits"
        let packDescription = ""

        if (customQuantity !== undefined) {
            quantity = parseInt(customQuantity, 10)
            if (isNaN(quantity) || quantity <= 0) {
                return new Response(JSON.stringify({ error: "La quantité de crédits doit être un entier positif." }), { status: 400, headers: corsHeaders })
            }
            packName = `Achat de crédits`
            packDescription = `Recharge de ${quantity} crédit${quantity > 1 ? 's' : ''}`
        } else if (packId) {
            const packs: Record<string, { name: string; description: string; credits: number }> = {
                'decouverte': {
                    name: 'Pack Découverte',
                    description: 'Pour démarrer (1 crédit)',
                    credits: 1
                },
                'pro': {
                    name: 'Pack Pro',
                    description: 'Le bon équilibre (5 crédits)',
                    credits: 5
                },
                'expert': {
                    name: 'Pack Expert',
                    description: 'Maximum d\'économies (10 crédits)',
                    credits: 10
                }
            }
            const selectedPack = packs[packId]
            if (!selectedPack) {
                return new Response(JSON.stringify({ error: "Invalid packId." }), { status: 400, headers: corsHeaders })
            }
            quantity = selectedPack.credits
            packName = selectedPack.name
            packDescription = selectedPack.description
        } else {
            return new Response(JSON.stringify({ error: "packId or customQuantity is required." }), { status: 400, headers: corsHeaders })
        }

        // Recalculate price server-side to prevent client-side manipulation (Rule: Palier 1: 200€, Palier 2: 180€, Palier 3: 160€)
        let unitPrice = 200
        if (quantity >= 10) {
            unitPrice = 160
        } else if (quantity >= 5) {
            unitPrice = 180
        }

        const origin = req.headers.get('origin') || 'http://localhost:5173'

        console.log(`[STRIPE] Creating Checkout Session for user ${user.id} (${user.email}), Quantity: ${quantity}, Unit Price: ${unitPrice}`)

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: packName,
                        description: packDescription,
                    },
                    unit_amount: unitPrice * 100, // Cents per unit
                },
                quantity: quantity,
            }],
            mode: 'payment',
            success_url: `${origin}/consultant/dashboard?payment=success&pack=${packId || 'custom'}&credits=${quantity}`,
            cancel_url: `${origin}/consultant/dashboard?payment=cancel`,
            client_reference_id: user.id,
            metadata: {
                consultant_id: user.id,
                pack_id: packId || 'custom',
                credits: quantity.toString()
            }
        })

        console.log(`[STRIPE] Checkout Session created: ${session.id}`)
        return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (err: any) {
        console.error(`[STRIPE_ERROR] Error creating checkout session: ${err.message}`)
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
})


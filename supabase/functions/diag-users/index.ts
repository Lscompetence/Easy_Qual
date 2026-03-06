import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const email = 'yassine1234@gmail.com';

    // Try to generate recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email
    });

    return new Response(
        JSON.stringify({
            linkData,
            linkError: linkError?.message
        }),
        { headers: { 'Content-Type': 'application/json' } }
    )
})

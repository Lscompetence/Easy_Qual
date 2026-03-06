import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = Deno.env.get('SUPABASE_URL') || '';
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(url, key)

    // 1. Fetch all tenants with email and valid password
    const { data: tenants, error: tErr } = await supabase.from('tenants').select('client_email, initial_password, owner_id');
    if (tErr) throw tErr;

    let results = [];
    for (const t of tenants) {
      if (!t.client_email || !t.initial_password) continue;

      const email = t.client_email;
      const password = t.initial_password;

      // Step A: Find the user ID. 
      // Try profile first since listUsers is broken.
      const { data: profile } = await supabase.from('profiles').select('id').ilike('email', email).maybeSingle();
      let uId = profile?.id || t.owner_id;

      if (uId) {
        // Step B: Set the password!
        const { error: pErr } = await supabase.auth.admin.updateUserById(uId, { password });
        results.push({ email, status: pErr ? "Password Sync Failed: " + pErr.message : "Success" });

        // Also fix owner_id if missing or wrong
        if (t.owner_id !== uId) {
          await supabase.from('tenants').update({ owner_id: uId }).eq('id', t.id);
        }
      } else {
        // Step C: If user doesn't exist at all, create them!
        const { data: newUser, error: cErr } = await supabase.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { role: 'of' }
        });
        if (cErr) {
          results.push({ email, status: "User Creation Failed: " + cErr.message });
        } else {
          await supabase.from('tenants').update({ owner_id: newUser.user.id }).eq('id', t.id);
          results.push({ email, status: "User CREATED and Synced" });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
})

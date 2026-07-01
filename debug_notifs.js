
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function debugNotifs() {
    // We need to act as an authenticated user to test RLS, 
    // but since we are in a script, we might use service role or just check data.
    // Let's use service role if available to see EVERYTHING and debug.
    const serviceSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await serviceSupabase
        .from('case_messages')
        .select(`
            id, content, sender_id,
            cases ( id, tenant_id )
        `)
        .ilike('content', '%[SYSTEM]%')
        .limit(5)

    if (error) {
        console.error("Error:", error)
        return
    }

    console.log("Found", data.length, "notifs")
    for (const n of data) {
        console.log("--- Notif ID:", n.id)
        console.log("Content:", n.content)
        console.log("Sender ID:", n.sender_id)
        console.log("Tenant ID:", n.cases?.tenant_id)

        // Check Profile
        const { data: profile } = await serviceSupabase.from('profiles').select('*').eq('id', n.sender_id).single()
        console.log("Profile Name:", profile ? `${profile.first_name} ${profile.last_name}` : "NOT FOUND")

        // Check Tenant
        if (n.cases?.tenant_id) {
            const { data: tenant } = await serviceSupabase.from('tenants').select('*').eq('id', n.cases.tenant_id).single()
            console.log("Tenant Name (Org):", tenant ? tenant.name : "NOT FOUND")
            console.log("Tenant Contact:", tenant ? `${tenant.first_name} ${tenant.last_name}` : "NOT FOUND")
        }
    }
}

debugNotifs()

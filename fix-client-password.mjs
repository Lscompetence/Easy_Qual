// Script to fix client login by calling invite-client with the proper tenant_id
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo'

const email = process.argv[2] || 'yassine1234@gmail.com'
const password = process.argv[3] || 'Yassine12345'

console.log(`\n🔧 Fixing password for: ${email}`)
console.log(`   Password to set: "${password}" (${password.length} chars)\n`)

const supabase = createClient(SUPABASE_URL, ANON_KEY)

// Step 1: Get tenant info from DB
const { data: tenants, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, name, owner_id, client_email, initial_password')
    .eq('client_email', email)

console.log('Tenant query error:', tenantErr)
console.log('Tenants found:', JSON.stringify(tenants, null, 2))

if (!tenants || tenants.length === 0) {
    console.log('❌ No tenant found for this email!')
    process.exit(1)
}

const tenant = tenants[0]
console.log(`\n✅ Found tenant: ID=${tenant.id}, Name=${tenant.name}`)
console.log(`   Stored password in DB: "${tenant.initial_password}"`)

// Step 2: Call invite-client Edge Function with correct tenant_id
console.log('\n📤 Calling invite-client...')
const res = await fetch(`${SUPABASE_URL}/functions/v1/invite-client`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
        email: email,
        password: password,
        tenant_id: tenant.id,
        tenant_name: tenant.name
    })
})

const data = await res.json()
console.log('HTTP Status:', res.status)
console.log('Response:', JSON.stringify(data, null, 2))

if (res.ok && data?.success) {
    console.log(`\n✅ PASSWORD FIXED! Client can now login:`)
    console.log(`   Email   : ${email}`)
    console.log(`   Password: ${password}`)

    // Update the DB too
    await supabase
        .from('tenants')
        .update({ initial_password: password })
        .eq('id', tenant.id)
    console.log(`   DB initial_password also updated ✅`)
} else {
    console.log(`\n❌ Failed: ${data?.error || 'Unknown error'}`)
}

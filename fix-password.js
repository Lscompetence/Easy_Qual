// fix-password.js - CommonJS version for older Node
const https = require('https')

const SUPABASE_URL = 'gxworwhpcyfuqwuxocxx.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo'

const email = process.argv[2] || 'yassine1234@gmail.com'
const password = process.argv[3] || 'Yassine12345'

console.log(`\n🔧 Finding tenant for: ${email}`)

function httpsRequest(hostname, path, method, headers, body) {
    return new Promise((resolve, reject) => {
        const req = https.request({ hostname, path, method, headers }, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
                catch { resolve({ status: res.statusCode, body: data }) }
            })
        })
        req.on('error', reject)
        if (body) req.write(body)
        req.end()
    })
}

async function main() {
    // Step 1: Get tenant
    const tenantRes = await httpsRequest(
        SUPABASE_URL,
        `/rest/v1/tenants?client_email=eq.${encodeURIComponent(email)}&select=id,name,owner_id,client_email,initial_password`,
        'GET',
        {
            'apikey': ANON_KEY,
            'Authorization': 'Bearer ' + ANON_KEY,
            'Content-Type': 'application/json'
        },
        null
    )

    console.log('Tenant status:', tenantRes.status)
    console.log('Tenant data:', JSON.stringify(tenantRes.body, null, 2))

    const tenants = tenantRes.body
    if (!tenants || !tenants.length) {
        console.log('❌ No tenant found!')
        return
    }

    const tenant = tenants[0]
    console.log(`\n✅ Tenant found: ID=${tenant.id}`)
    console.log(`   Password in DB: "${tenant.initial_password}"`)

    // Step 2: Call invite-client
    const bodyStr = JSON.stringify({
        email: email,
        password: password,
        tenant_id: tenant.id,
        tenant_name: tenant.name
    })

    console.log(`\n📤 Calling invite-client with password: "${password}"`)

    const fnRes = await httpsRequest(
        SUPABASE_URL,
        '/functions/v1/invite-client',
        'POST',
        {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + ANON_KEY,
            'Content-Length': Buffer.byteLength(bodyStr)
        },
        bodyStr
    )

    console.log('Function status:', fnRes.status)
    console.log('Function response:', JSON.stringify(fnRes.body, null, 2))

    if (fnRes.status === 200 && fnRes.body.success) {
        console.log(`\n✅ SUCCESS! Login avec:`)
        console.log(`   Email: ${email}`)
        console.log(`   Mot de passe: ${password}`)
    } else {
        console.log('\n❌ Erreur. Essayez depuis Dossiers Clients > bouton ↺')
    }
}

main().catch(console.error)

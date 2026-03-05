// Test direct de la Edge Function invite-client
const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo'

async function testInvite() {
    console.log('🔍 Test de la Edge Function invite-client...\n')

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/invite-client`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify({
                email: 'yassine1234@gmail.com',
                password: 'Yassine123456',
                tenant_id: '00000000-0000-0000-0000-000000000000', // ID fictif pour le test
                tenant_name: 'Yassine Test'
            })
        })

        const data = await response.json()
        console.log('📊 Status HTTP:', response.status)
        console.log('📦 Réponse:', JSON.stringify(data, null, 2))

        if (response.ok && data.success) {
            console.log('\n✅ La Edge Function fonctionne correctement !')
            console.log('   → Le compte devrait être créé dans Supabase Auth')
        } else {
            console.log('\n❌ PROBLÈME avec la Edge Function :')
            console.log('   → Erreur:', data.error || 'Inconnue')
        }
    } catch (err) {
        console.log('\n❌ Erreur réseau :', err.message)
    }
}

testInvite()

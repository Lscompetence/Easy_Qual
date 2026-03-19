import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo'

async function syncAll() {
    console.log("🚀 Démarrage de la synchronisation globale des clients...\n")
    const supabase = createClient(SUPABASE_URL, ANON_KEY)

    // 1. Récupérer tous les clients de la table tenants
    const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id, name, client_email, initial_password')
        .not('client_email', 'is', null)
        .not('initial_password', 'is', null)

    if (error) {
        console.error('❌ Erreur lors de la récupération des clients:', error)
        return
    }

    console.log(`📊 ${tenants.length} clients trouvés dans la base de données.\n`)

    let successCount = 0
    let failCount = 0

    for (const t of tenants) {
        process.stdout.write(`🔄 Synchro: ${t.client_email} ... `)

        try {
            const res = await fetch(`${SUPABASE_URL}/functions/v1/invite-client`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ANON_KEY}`
                },
                body: JSON.stringify({
                    email: t.client_email,
                    password: t.initial_password,
                    tenant_id: t.id,
                    tenant_name: t.name || 'Client'
                })
            })

            const data = await res.json()

            if (res.ok && data?.success) {
                console.log("✅ OK")
                successCount++
            } else {
                console.log(`❌ ÉCHOUÉ (${data?.error || 'Erreur inconnue'})`)
                if (data?.tip) console.log(`   💡 Tip: ${data.tip}`)
                failCount++
            }
        } catch (e) {
            console.log(`❌ ERREUR CRITIQUE: ${e.message}`)
            failCount++
        }
    }

    console.log(`\n✨ Terminé !`)
    console.log(`✅ Succès: ${successCount}`)
    console.log(`❌ Échecs: ${failCount}`)

    if (failCount > 0) {
        console.log(`\n⚠️ Certains clients n'ont pas pu être synchronisés.`)
        console.log(`   Si l'erreur est "password too short", vérifiez vos paramètres Supabase.`)
    }
}

syncAll()

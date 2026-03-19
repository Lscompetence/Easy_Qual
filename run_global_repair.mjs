import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo'

async function runRepair() {
    console.log("🛠️ Exécution de la réparation globale des comptes clients...")

    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/repair-all-clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            }
        })

        if (!res.ok) {
            const errorText = await res.text()
            console.error(`❌ Erreur HTTP ${res.status}: ${errorText}`)
            return
        }

        const data = await res.json()
        console.log("📊 Résultats de la réparation :\n")

        if (data.results && data.results.length > 0) {
            data.results.forEach(r => {
                console.log(`- ${r.email}: [${r.status.toUpperCase()}] ${r.error ? `-> Erreur: ${r.error}` : ''}`)
            })
        } else {
            console.log("ℹ️ Aucun client trouvé à traiter.")
        }

    } catch (e) {
        console.error(`❌ Erreur lors de l'appel : ${e.message}`)
    }
}

runRepair()

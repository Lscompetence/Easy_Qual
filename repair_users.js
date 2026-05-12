import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MDAxOCwiZXhwIjoyMDg1MTY2MDE4fQ.-2V0Fr7H54IyJxzgAglYLolrDuF0CH8kN1G3NHjaS_k' 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function finalAdminRepair() {
    const TARGET_EMAIL = 'yassinealaoui095@gmail.com'
    console.log(`[🚀] RÉPARATION FINALE POUR: ${TARGET_EMAIL}`)

    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email === TARGET_EMAIL)
    
    if (!user) {
        console.error("Utilisateur introuvable.")
        return
    }




    // 🔥 CRITIQUE: On injecte le rôle dans les "user_metadata"
    // C'est ce qui permet au site de vous laisser passer sans attendre !
    console.log("[🛠️] Injection du rôle Admin dans les métadonnées d'identité...")
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { role: 'admin' },
        app_metadata: { role: 'admin' }
    })

    if (updateError) throw updateError

    console.log("[✅] SUCCÈS ! Votre identité est maintenant marquée comme ADMIN.")
    console.log("Connectez-vous sur http://localhost:5173/login?role=admin")
}

finalAdminRepair()

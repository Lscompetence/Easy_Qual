import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

console.log('🔍 Test de connexion avec yassine1234@gmail.com / Yassine123456...\n')

const { data, error } = await supabase.auth.signInWithPassword({
    email: 'yassine1234@gmail.com',
    password: 'Yassine123456'
})

if (error) {
    console.log('❌ Échec de connexion:', error.message)
    console.log('   Status:', error.status)
    console.log('\n→ Le compte n\'existe pas dans Supabase Auth avec ce mot de passe')
} else {
    console.log('✅ Connexion réussie!')
    console.log('   User ID:', data.user.id)
    console.log('   Role:', data.user.user_metadata?.role)
}

process.exit(0)

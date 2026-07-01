import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MDAxOCwiZXhwIjoyMDg1MTY2MDE4fQ.-2V0Fr7H54IyJxzgAglYLolrDuF0CH8kN1G3NHjaS_k'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkEmails() {
    const emailsToCheck = ['itatchiouchiha70@gmail.com', 'itatchiouchiha70@gmail', 'alaoui.yassine.emsi@gmail.com']
    console.log("Checking specific emails...")
    
    const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers()
    
    for (const email of emailsToCheck) {
        const found = users.filter(u => u.email === email)
        console.log(`Email '${email}': Found ${found.length} times in auth.users`)
        
        // Let's also check if we can safely delete them if they exist
        for (const u of found) {
            console.log(`   Deleting leftover user ${u.id}...`)
            await supabase.auth.admin.deleteUser(u.id)
            await supabase.from('profiles').delete().eq('id', u.id)
        }
    }
    console.log("Check complete.")
}

checkEmails()

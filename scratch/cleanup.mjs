import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MDAxOCwiZXhwIjoyMDg1MTY2MDE4fQ.-2V0Fr7H54IyJxzgAglYLolrDuF0CH8kN1G3NHjaS_k'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function cleanup() {
    console.log("Cleaning up test users...")
    const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers()
    
    for (const u of users) {
        if (['test_invoke_err@example.com', 'a@b.c', 'test_new_consultant_error@example.com'].includes(u.email)) {
            console.log(`Deleting ${u.email}...`)
            await supabase.auth.admin.deleteUser(u.id)
            await supabase.from('profiles').delete().eq('id', u.id)
        }
    }
    console.log("Done.")
}

cleanup()

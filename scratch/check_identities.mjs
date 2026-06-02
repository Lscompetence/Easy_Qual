import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MDAxOCwiZXhwIjoyMDg1MTY2MDE4fQ.-2V0Fr7H54IyJxzgAglYLolrDuF0CH8kN1G3NHjaS_k' 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function check() {
    // Attempt to query identities if possible, though it's in auth schema
    // the JS client admin api can list users and their identities
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) {
        console.error("Error listing users:", error)
        return
    }
    
    console.log("Users and their identities:");
    users.forEach(u => {
        console.log(`- ${u.email} (ID: ${u.id})`);
        console.log(`  Identities: ${u.identities?.map(i => i.identity_data?.email).join(', ') || 'None'}`);
    });
}

check()

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MDAxOCwiZXhwIjoyMDg1MTY2MDE4fQ.-2V0Fr7H54IyJxzgAglYLolrDuF0CH8kN1G3NHjaS_k' 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function testCreate() {
    const email = 'test_new_consultant_error@example.com'
    console.log(`[🚀] TESTING CREATION FOR: ${email}`)

    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: { first_name: 'Test', last_name: 'Consultant', role: 'consultant' }
    });

    if (error) {
        console.error("❌ ERROR CREATING USER:")
        console.error(error)
    } else {
        console.log("✅ USER CREATED SUCCESSFULLY:")
        console.log(data)
        
        // Clean up
        await supabase.auth.admin.deleteUser(data.user.id)
        console.log("User deleted.")
    }
}

testCreate()

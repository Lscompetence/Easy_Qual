import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function testEdgeFunction() {
    console.log("Invoking edge function with SHORT EMAIL...")
    const { data, error } = await supabase.functions.invoke('admin_create_consultant', {
        body: {
            action: 'create_consultant',
            email: 'a@b.c',
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            commercialName: '',
            siret: '',
            phone: '+33600000000',
            initialCredits: 10
        }
    })

    if (error) {
        console.error("Function invoke error:", error)
    } else {
        console.log("Function returned:", data)
    }
}

testEdgeFunction()

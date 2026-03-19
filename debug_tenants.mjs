import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo'
const supabase = createClient(SUPABASE_URL, ANON_KEY)
const { data, error } = await supabase.from('tenants').select('*')
console.log(JSON.stringify(data, null, 2))
console.log('Error:', error)

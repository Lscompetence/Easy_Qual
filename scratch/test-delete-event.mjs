import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim()
const envKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim()

const supabase = createClient(envUrl, envKey)

async function testDelete() {
    console.log("Testing delete on case_events...")
    const { data: events, error: fetchErr } = await supabase.from('case_events').select('id, case_id').limit(1)
    if (fetchErr) {
        console.error("Fetch error:", fetchErr)
        return
    }
    if (!events || events.length === 0) {
        console.log("No events found.")
        return
    }

    const eventId = events[0].id
    
    // Test delete (but we don't have user auth, so it will fail due to RLS, but we can see the exact error)
    // Actually, RLS will just return 0 rows deleted instead of throwing an error!
    const { data, error } = await supabase.from('case_events').delete().eq('id', eventId).select()
    console.log("Delete result:", data, error)
}

testDelete()

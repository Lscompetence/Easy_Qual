import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim()
const envKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim()

const supabase = createClient(envUrl, envKey)

async function testUpdate() {
    console.log("Testing update on case_events without updated_at...")
    // Just find one event ID first
    const { data: events, error: fetchErr } = await supabase.from('case_events').select('id, status').limit(1)
    if (fetchErr) {
        console.error("Fetch error:", fetchErr)
        return
    }
    if (!events || events.length === 0) {
        console.log("No events found to update.")
        return
    }

    const eventId = events[0].id
    
    // Test update with updated_at
    const { error: err1 } = await supabase.from('case_events').update({ updated_at: new Date().toISOString() }).eq('id', eventId)
    console.log("Update with updated_at error:", err1)

    // Test update without updated_at
    const { error: err2 } = await supabase.from('case_events').update({ status: 'done' }).eq('id', eventId)
    console.log("Update status error:", err2)

    // Revert status
    await supabase.from('case_events').update({ status: events[0].status }).eq('id', eventId)
}

testUpdate()

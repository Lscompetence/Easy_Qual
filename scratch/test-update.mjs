import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
if (!process.env.VITE_SUPABASE_URL) dotenv.config({ path: '.env' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)

async function testUpdate() {
  const { data: events, error: fetchErr } = await supabase.from('case_events').select('id').limit(1)
  if (fetchErr || !events.length) {
    console.log("Error fetching or no events:", fetchErr)
    return
  }
  const id = events[0].id
  
  const { error } = await supabase.from('case_events').update({
    client_signature_name: 'Test'
  }).eq('id', id)
  
  console.log("Update error:", error)
}
testUpdate()

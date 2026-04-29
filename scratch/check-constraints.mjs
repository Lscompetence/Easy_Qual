import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function getConstraints() {
  const { data, error } = await supabase.rpc('query_constraints', { query: "SELECT conname FROM pg_constraint WHERE conrelid = 'consultant_resources'::regclass;" })
  
  // if rpc doesn't exist, we can't do it this way easily without the service role key or admin privileges
  console.log("data:", data, "error:", error)
}
getConstraints()

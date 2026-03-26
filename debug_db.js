
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  "https://gxworwhpcyfuqwuxocxx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo"
)

async function debug() {
  console.log("Searching for most recent indicator states...")
  const { data, error } = await supabase
    .from('case_indicator_states')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error(error)
    return
  }

  console.log(JSON.stringify(data, null, 2))
}

debug()

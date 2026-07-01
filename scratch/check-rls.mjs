import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
if (!process.env.VITE_SUPABASE_URL) dotenv.config({ path: '.env' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)

async function checkRLS() {
    const { data: policies, error: pError } = await supabase.from('pg_policies').select('*').eq('tablename', 'case_events')
    console.log("Policies:", policies, pError)
}
checkRLS()

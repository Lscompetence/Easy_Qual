import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gxworwhpcyfuqwuxocxx.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkSchema() {
    const { data, error } = await supabase.from('case_events').select('*').limit(1)
    console.log(data, error)
}
checkSchema()

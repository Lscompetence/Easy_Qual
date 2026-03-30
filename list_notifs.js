
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gxworwhpcyfuqwuxocxx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo');

async function check() {
    const { data: casesData, error: casesError } = await supabase.from('cases').select('id').limit(1);
    console.log("CASES:", casesData?.length || 0, casesError?.message || "");
    
    const { data: tenantsData, error: tenantsError } = await supabase.from('tenants').select('id').limit(1);
    console.log("TENANTS:", tenantsData?.length || 0, tenantsError?.message || "");
    
    const { data: msgsData, error: msgsError } = await supabase.from('case_messages').select('id').limit(1);
    console.log("MESSAGES:", msgsData?.length || 0, msgsError?.message || "");
}
check();

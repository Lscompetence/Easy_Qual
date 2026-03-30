
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gxworwhpcyfuqwuxocxx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo');

async function check() {
    console.log("CHECKING TENANTS COLUMNS...");
    const { data, error } = await supabase.from('tenants').select('*').limit(1);
    if (error) {
        console.error("ERROR:", error.message);
    } else if (data && data.length > 0) {
        console.log("COLUMNS IN TENANTS:", Object.keys(data[0]).join(', '));
    } else {
        console.log("TABLE IS EMPTY FOR ANON.");
    }
}
check();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gxworwhpcyfuqwuxocxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const caseId = 'db979c92-3234-44a2-b9af-6660caf9a966';

async function test() {
    console.log("Checking ALL case_messages...");
    const { data, error } = await supabase
        .from('case_messages')
        .select('*')
        .limit(10);
    
    if (error) {
        console.error("Error fetching messages:", error);
    } else {
        console.log("Success! Messages found in table:", data.length);
        data.forEach(m => console.log(`- [${m.created_at}] Case: ${m.case_id} Content: ${m.content}`));
    }
}

test();

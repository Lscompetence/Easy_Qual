import { supabase } from './src/supabaseClient.js';

const caseId = 'db979c92-3234-44a2-b9af-6660caf9a966';

async function test() {
    console.log("Testing fetch for case:", caseId);
    const { data, error } = await supabase
        .from('case_messages')
        .select('*')
        .eq('case_id', caseId);
    
    if (error) console.error("Error:", error);
    else console.log("Data found:", data?.length, "messages", data);
}

test();

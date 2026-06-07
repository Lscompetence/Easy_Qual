const url = 'https://gxworwhpcyfuqwuxocxx.supabase.co/rest/v1/questionnaires_results?select=*&limit=1';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo';

async function check() {
    const res = await fetch(url, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log(res.status);
    console.log(await res.text());
}
check();

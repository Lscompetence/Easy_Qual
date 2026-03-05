fetch('https://gxworwhpcyfuqwuxocxx.supabase.co/functions/v1/invite-client', {
    method: 'POST',
    body: JSON.stringify({ email: 'script.test2@test.com', password: '123', tenant_id: '11111111-1111-1111-1111-111111111111' }),
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4d29yd2hwY3lmdXF3dXhvY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTAwMTgsImV4cCI6MjA4NTE2NjAxOH0.VCD3Cs-syfEdTIAIms9VRBOsYI0PrRn8IxR9oXgOtQo'
    }
}).then(async r => {
    console.log(r.status);
    console.log(await r.text());
}).catch(console.error);

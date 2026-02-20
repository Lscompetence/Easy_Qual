-- Create case_events table for Planning Roadmap (Corrected)
CREATE TABLE IF NOT EXISTS case_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    event_date timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'done', 'cancelled'
    event_type text NOT NULL DEFAULT 'meeting', -- 'meeting', 'milestone', 'audit'
    visio_link text,
    created_at timestamptz DEFAULT now(),
    created_by uuid DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;

-- Policy: Consultant can manage events (Check created_by of the associated tenant)
CREATE POLICY "Consultant manage events" ON case_events FOR ALL USING (
    EXISTS (
        SELECT 1 
        FROM cases 
        JOIN tenants ON cases.tenant_id = tenants.id
        WHERE cases.id = case_events.case_id 
        AND tenants.created_by = auth.uid()
    )
);

-- Policy: Client can view events (Check tenant_id of the user matching case)
CREATE POLICY "Client view events" ON case_events FOR SELECT USING (
    EXISTS (
        SELECT 1 
        FROM cases 
        WHERE cases.id = case_events.case_id 
        AND cases.tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    )
);

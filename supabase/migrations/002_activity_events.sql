-- Activity events for the dashboard feed
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'deal_created', 'deal_stage_changed', 'deal_updated', 'deal_deleted',
      'reference_added', 'reference_status_changed', 'reference_deleted',
      'note_added', 'signal_report_generated'
    )),
  title TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON activity_events FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_activity_events_deal_id ON activity_events(deal_id);
CREATE INDEX idx_activity_events_created_at ON activity_events(created_at DESC);

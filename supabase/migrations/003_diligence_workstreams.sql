CREATE TABLE diligence_workstreams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN (
                'customer', 'legal', 'financial', 'technical', 'market', 'team', 'commercial'
              )),
  title       TEXT NOT NULL,
  owner       TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started', 'in_progress', 'blocked', 'complete')),
  priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
  due_date    TIMESTAMPTZ,
  notes       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diligence_workstreams_deal_id ON diligence_workstreams(deal_id);
ALTER TABLE diligence_workstreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON diligence_workstreams FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_diligence_workstreams_updated_at
  BEFORE UPDATE ON diligence_workstreams
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

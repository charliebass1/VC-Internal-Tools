-- Deals table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_website TEXT NOT NULL DEFAULT '',
  sector TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'screening'
    CHECK (stage IN ('screening', 'deep_dive', 'ic_review', 'closed')),
  lead_partner TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reference contacts table
CREATE TABLE reference_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'company_provided'
    CHECK (source IN ('company_provided', 'discovered', 'backchannel')),
  status TEXT NOT NULL DEFAULT 'identified'
    CHECK (status IN ('identified', 'outreach_sent', 'scheduled', 'completed', 'declined')),
  outreach_template TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reference notes table
CREATE TABLE reference_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id UUID NOT NULL REFERENCES reference_contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  call_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  interviewer TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Signal reports table
CREATE TABLE signal_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  signals JSONB NOT NULL DEFAULT '[]',
  red_flags JSONB NOT NULL DEFAULT '[]',
  green_flags JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reference_contacts_updated_at
  BEFORE UPDATE ON reference_contacts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (open policies for now — tighten when auth is added)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON reference_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON reference_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON signal_reports FOR ALL USING (true) WITH CHECK (true);

-- Indexes for common lookups
CREATE INDEX idx_reference_contacts_deal_id ON reference_contacts(deal_id);
CREATE INDEX idx_reference_notes_reference_id ON reference_notes(reference_id);
CREATE INDEX idx_signal_reports_deal_id ON signal_reports(deal_id);

-- Phase 3: Contacts, touchpoints, and integrations (Granola)

-- Contacts: people in the firm's network (independent of deals)
CREATE TABLE contacts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  title                 TEXT NOT NULL DEFAULT '',
  company               TEXT NOT NULL DEFAULT '',
  email                 TEXT NOT NULL DEFAULT '',
  linkedin_url          TEXT NOT NULL DEFAULT '',
  relationship_strength TEXT NOT NULL DEFAULT 'cold' CHECK (relationship_strength IN ('strong', 'warm', 'cold')),
  tags                  JSONB NOT NULL DEFAULT '[]',
  notes                 TEXT NOT NULL DEFAULT '',
  last_contact_date     TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON contacts FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_company ON contacts(company);

-- Touchpoints: every interaction (meetings, emails, calls, intros, notes)
CREATE TABLE touchpoints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN ('meeting', 'email', 'call', 'intro', 'note')),
  title           TEXT NOT NULL DEFAULT '',
  content         TEXT NOT NULL DEFAULT '',
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      TEXT NOT NULL DEFAULT '',
  source          TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'granola', 'import')),
  external_id     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE touchpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON touchpoints FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_touchpoints_deal_id ON touchpoints(deal_id);
CREATE INDEX idx_touchpoints_contact_id ON touchpoints(contact_id);
CREATE INDEX idx_touchpoints_occurred_at ON touchpoints(occurred_at);
CREATE INDEX idx_touchpoints_external_id ON touchpoints(external_id);

-- Integration settings (Granola API key, sync state)
CREATE TABLE integration_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL UNIQUE CHECK (provider IN ('granola')),
  api_key         TEXT NOT NULL DEFAULT '',
  enabled         BOOLEAN NOT NULL DEFAULT false,
  last_synced_at  TIMESTAMPTZ,
  sync_cursor     TEXT NOT NULL DEFAULT '',
  config          JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON integration_settings FOR ALL USING (true) WITH CHECK (true);

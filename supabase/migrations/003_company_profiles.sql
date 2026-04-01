-- Phase 2: Company auto-enrichment profiles
CREATE TABLE company_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID NOT NULL UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
  logo_url        TEXT NOT NULL DEFAULT '',
  founded_year    INTEGER,
  team_size_range TEXT NOT NULL DEFAULT '',
  funding_stage   TEXT NOT NULL DEFAULT '',
  total_raised    TEXT NOT NULL DEFAULT '',
  competitors     JSONB NOT NULL DEFAULT '[]',
  key_people      JSONB NOT NULL DEFAULT '[]',
  ai_summary      TEXT NOT NULL DEFAULT '',
  enriched_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON company_profiles FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_company_profiles_deal_id ON company_profiles(deal_id);

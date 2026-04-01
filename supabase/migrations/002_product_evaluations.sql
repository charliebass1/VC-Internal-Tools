-- Product evaluations table for structured product scoring
CREATE TABLE product_evaluations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id               UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Scoring dimensions (1-5 scale)
  ux_score              INTEGER CHECK (ux_score BETWEEN 1 AND 5),
  performance_score     INTEGER CHECK (performance_score BETWEEN 1 AND 5),
  integration_score     INTEGER CHECK (integration_score BETWEEN 1 AND 5),
  roadmap_score         INTEGER CHECK (roadmap_score BETWEEN 1 AND 5),
  moat_score            INTEGER CHECK (moat_score BETWEEN 1 AND 5),

  -- Notes per dimension
  ux_notes              TEXT NOT NULL DEFAULT '',
  performance_notes     TEXT NOT NULL DEFAULT '',
  integration_notes     TEXT NOT NULL DEFAULT '',
  roadmap_notes         TEXT NOT NULL DEFAULT '',
  moat_notes            TEXT NOT NULL DEFAULT '',

  -- Review aggregation
  g2_rating             NUMERIC(3,2),
  g2_review_count       INTEGER,
  capterra_rating       NUMERIC(3,2),
  capterra_review_count INTEGER,
  review_summary        TEXT NOT NULL DEFAULT '',

  -- Demo analysis
  demo_transcript       TEXT NOT NULL DEFAULT '',
  demo_analysis         TEXT NOT NULL DEFAULT '',
  demo_date             TIMESTAMPTZ,

  -- Metadata
  evaluator             TEXT NOT NULL DEFAULT '',
  overall_score         NUMERIC(3,2),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One evaluation per deal
CREATE UNIQUE INDEX idx_product_evaluations_deal_id ON product_evaluations(deal_id);

-- RLS
ALTER TABLE product_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON product_evaluations FOR ALL USING (true) WITH CHECK (true);

-- Auto-update timestamp
CREATE TRIGGER update_product_evaluations_updated_at
  BEFORE UPDATE ON product_evaluations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

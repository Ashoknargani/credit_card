/*
# Create prediction history table (single-tenant, no auth)

1. New Tables
- `predictions`
  - `id` (uuid, primary key)
  - `applicant_data` (jsonb, not null) — full applicant input
  - `prediction` (text, not null) — "Approved" or "Rejected"
  - `probability` (numeric, not null) — approval probability 0..1
  - `risk` (text, not null) — "Low", "Medium", or "High"
  - `factors` (jsonb, nullable) — explainability factors
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `predictions`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (no sign-in app).
*/

CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_data jsonb NOT NULL,
  prediction text NOT NULL,
  probability numeric(5,4) NOT NULL,
  risk text NOT NULL,
  factors jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_predictions" ON predictions;
CREATE POLICY "anon_select_predictions" ON predictions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_predictions" ON predictions;
CREATE POLICY "anon_insert_predictions" ON predictions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_predictions" ON predictions;
CREATE POLICY "anon_update_predictions" ON predictions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_predictions" ON predictions;
CREATE POLICY "anon_delete_predictions" ON predictions FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS predictions_created_at_idx ON predictions (created_at DESC);
CREATE INDEX IF NOT EXISTS predictions_prediction_idx ON predictions (prediction);

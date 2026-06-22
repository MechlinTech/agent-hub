-- Executive summary library: saved script-level summaries with per-script Bug ID / comments
CREATE TABLE IF NOT EXISTS executive_summary_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  analysis_id uuid REFERENCES results_analyses(id) ON DELETE SET NULL,
  external_analysis_id text,
  master_id text,
  run_name text NOT NULL,
  environment text,
  project_name text,
  build_version text,
  bug_id text NOT NULL DEFAULT '',
  comments text NOT NULL DEFAULT '',
  script_summaries jsonb NOT NULL DEFAULT '[]'::jsonb,
  script_count integer NOT NULL DEFAULT 0,
  pass_count integer NOT NULL DEFAULT 0,
  fail_count integer NOT NULL DEFAULT 0,
  exported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS executive_summary_library_exported_at_idx
  ON executive_summary_library (exported_at DESC);

ALTER TABLE executive_summary_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read executive summary library"
  ON executive_summary_library FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert executive summary library"
  ON executive_summary_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update executive summary library"
  ON executive_summary_library FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete executive summary library"
  ON executive_summary_library FOR DELETE
  TO authenticated
  USING (true);

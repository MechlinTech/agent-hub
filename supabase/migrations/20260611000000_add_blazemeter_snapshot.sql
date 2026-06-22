-- Run in Supabase SQL editor if blazemeter_snapshot column is missing
ALTER TABLE results_analyses ADD COLUMN IF NOT EXISTS blazemeter_snapshot jsonb;

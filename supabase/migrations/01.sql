-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  team_name text DEFAULT 'Performance Team'::text,
  avatar_url text,
  role text DEFAULT 'performance_engineer'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.super_admins (
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT super_admins_pkey PRIMARY KEY (user_id),
  CONSTRAINT super_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE TABLE public.user_access_overrides (
  user_id uuid NOT NULL,
  resource text NOT NULL CHECK (resource IN (
    'script_review', 'results_analysis', 'integrations', 'settings', 'users'
  )),
  access_level text NOT NULL CHECK (access_level IN ('none', 'read', 'write')),
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_access_overrides_pkey PRIMARY KEY (user_id, resource),
  CONSTRAINT user_access_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_access_overrides_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.user_settings (
  user_id uuid NOT NULL,
  ai_recommendation_mode text NOT NULL DEFAULT 'disabled'::text CHECK (ai_recommendation_mode = ANY (ARRAY['disabled'::text, 'enabled'::text])),
  use_builtin_templates boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  rule_config jsonb NOT NULL DEFAULT '{"rulePack": "BlazeMeter Best Practices v3.2", "testType": "web", "disabledRules": [], "ruleCategories": ["structure", "assertions", "security", "thread_groups", "correlation", "data_files", "timers", "parameterization", "cloud_readiness"], "includeSecurity": true, "includeBlazeMeter": true, "severityThreshold": "medium"}'::jsonb,
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.rule_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text,
  description text,
  rule_count integer DEFAULT 0,
  category text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rule_packs_pkey PRIMARY KEY (id)
);

CREATE TYPE review_status AS ENUM (
  'pending', 'parsing', 'scanning', 'scoring', 'completed', 'failed'
);

CREATE TYPE readiness_status AS ENUM (
  'ready', 'ready_minor', 'not_ready', 'high_risk', 'failed'
);

CREATE TABLE public.script_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  external_review_id text UNIQUE,
  user_id uuid NOT NULL,
  script_name text NOT NULL,
  script_path text,
  file_size_bytes bigint,
  storage_path text,
  status review_status DEFAULT 'pending',
  progress_percent integer DEFAULT 0,
  current_step text,
  score integer,
  readiness readiness_status,
  executive_summary text,
  test_type text DEFAULT 'web'::text,
  rule_pack_id uuid,
  config jsonb DEFAULT '{}'::jsonb,
  inventory jsonb DEFAULT '{}'::jsonb,
  top_risks jsonb DEFAULT '[]'::jsonb,
  fix_order jsonb DEFAULT '[]'::jsonb,
  ai_mode text DEFAULT 'disabled'::text,
  error_message text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT script_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT script_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT script_reviews_rule_pack_id_fkey FOREIGN KEY (rule_pack_id) REFERENCES public.rule_packs(id)
);

CREATE TYPE finding_status AS ENUM (
  'open', 'in_progress', 'acknowledged', 'resolved', 'wont_fix'
);

CREATE TYPE finding_severity AS ENUM (
  'critical', 'high', 'medium', 'low', 'info'
);

CREATE TABLE public.review_findings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  finding_code text,
  script_review_id uuid NOT NULL,
  rule_id text NOT NULL,
  severity finding_severity DEFAULT 'medium',
  category text,
  element text,
  issue text NOT NULL,
  impact text,
  recommendation text,
  why_it_matters text,
  detected_value text,
  location_path text,
  code_snippet text,
  fix_pattern_current text,
  fix_pattern_recommended text,
  status finding_status DEFAULT 'open',
  confidence text DEFAULT 'high'::text,
  occurrences integer DEFAULT 1,
  related_finding_ids text[],
  tags text[],
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_findings_pkey PRIMARY KEY (id),
  CONSTRAINT review_findings_script_review_id_fkey FOREIGN KEY (script_review_id) REFERENCES public.script_reviews(id)
);
CREATE TABLE public.review_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  script_review_id uuid NOT NULL,
  message text NOT NULL,
  log_type text DEFAULT 'info'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT review_activity_logs_script_review_id_fkey FOREIGN KEY (script_review_id) REFERENCES public.script_reviews(id)
);
CREATE TABLE public.review_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  script_review_id uuid,
  file_name text NOT NULL,
  file_type text,
  file_size_bytes bigint,
  storage_path text,
  validation_status text DEFAULT 'valid'::text,
  validation_warnings integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_assets_pkey PRIMARY KEY (id),
  CONSTRAINT review_assets_script_review_id_fkey FOREIGN KEY (script_review_id) REFERENCES public.script_reviews(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  subtitle text,
  notification_type text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.report_exports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  script_review_id uuid NOT NULL,
  user_id uuid NOT NULL,
  format text NOT NULL CHECK (format = ANY (ARRAY['markdown'::text, 'html'::text, 'json'::text, 'pdf'::text])),
  storage_path text,
  file_name text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT report_exports_pkey PRIMARY KEY (id),
  CONSTRAINT report_exports_script_review_id_fkey FOREIGN KEY (script_review_id) REFERENCES public.script_reviews(id),
  CONSTRAINT report_exports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.test_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size_bytes bigint,
  storage_path text NOT NULL,
  script_review_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT test_assets_pkey PRIMARY KEY (id),
  CONSTRAINT test_assets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT test_assets_script_review_id_fkey FOREIGN KEY (script_review_id) REFERENCES public.script_reviews(id)
);
CREATE TABLE public.org_settings (
  id text NOT NULL DEFAULT 'default'::text,
  blazemeter_enabled boolean NOT NULL DEFAULT false,
  blazemeter_test_provisioning_mode text NOT NULL DEFAULT 'create_per_review'::text CHECK (blazemeter_test_provisioning_mode = ANY (ARRAY['create_per_review'::text, 'reuse_existing'::text])),
  blazemeter_account_id bigint,
  blazemeter_workspace_id bigint,
  blazemeter_project_id bigint,
  blazemeter_reuse_test_id bigint,
  blazemeter_reuse_test_name text,
  blazemeter_default_location text NOT NULL DEFAULT 'us-east-1'::text,
  blazemeter_last_validated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  blazemeter_account_name text,
  blazemeter_workspace_name text,
  blazemeter_project_name text,
  blazemeter_api_key_id text,
  blazemeter_api_key_secret text,
  role_access_defaults jsonb,
  custom_roles jsonb DEFAULT '[]'::jsonb,
  admin_configurable_resources jsonb,
  CONSTRAINT org_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sla_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sla_profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.results_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  external_id text NOT NULL UNIQUE,
  run_name text NOT NULL,
  master_id text,
  input_method text NOT NULL DEFAULT 'csv'::text,
  status text NOT NULL DEFAULT 'draft'::text,
  progress_percent integer NOT NULL DEFAULT 0,
  current_step text,
  test_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  sla_profile_id uuid,
  uploaded_files jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_status text,
  performance_score integer,
  go_no_go text,
  executive_summary text,
  top_risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_payload jsonb,
  error_message text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  blazemeter_snapshot jsonb,
  CONSTRAINT results_analyses_pkey PRIMARY KEY (id),
  CONSTRAINT results_analyses_sla_profile_id_fkey FOREIGN KEY (sla_profile_id) REFERENCES public.sla_profiles(id)
);
CREATE TABLE public.executive_summary_library (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  analysis_id uuid,
  external_analysis_id text,
  master_id text,
  run_name text NOT NULL,
  environment text,
  project_name text,
  build_version text,
  bug_id text NOT NULL DEFAULT ''::text,
  comments text NOT NULL DEFAULT ''::text,
  script_summaries jsonb NOT NULL DEFAULT '[]'::jsonb,
  script_count integer NOT NULL DEFAULT 0,
  pass_count integer NOT NULL DEFAULT 0,
  fail_count integer NOT NULL DEFAULT 0,
  exported_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  CONSTRAINT executive_summary_library_pkey PRIMARY KEY (id),
  CONSTRAINT executive_summary_library_analysis_id_fkey FOREIGN KEY (analysis_id) REFERENCES public.results_analyses(id),
  CONSTRAINT executive_summary_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('script-assets', 'script-assets', false, 200 * 1024 * 1024, ARRAY[
    'application/xml', 'text/xml', 'text/csv', 'application/octet-stream', 'application/pdf', 'text/plain', 'application/x-yaml'
  ])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 200 * 1024 * 1024;

INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('results-assets', 'results-assets', false, 200 * 1024 * 1024)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 200 * 1024 * 1024;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "Authenticated users can delete executive summary library"
ON public.executive_summary_library
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert executive summary library"
ON public.executive_summary_library
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Authenticated users can read executive summary library"
ON public.executive_summary_library
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update executive summary library"
ON public.executive_summary_library
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "notifications_all"
ON public.notifications
FOR ALL
TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Authenticated users can read org settings"
ON public.org_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert org_settings"
ON public.org_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update org_settings"
ON public.org_settings
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete org_settings"
ON public.org_settings
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT
TO public
WITH CHECK ((auth.uid() = id));

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can read own super admin row"
ON public.super_admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins manage super_admins"
ON public.super_admins
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view own access overrides"
ON public.user_access_overrides
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage access overrides"
ON public.user_access_overrides
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "report_exports_all"
ON public.report_exports
FOR ALL
TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Authenticated users can manage results_analyses"
ON public.results_analyses
FOR ALL
TO public
USING ((auth.role() = 'authenticated'::text))
WITH CHECK ((auth.role() = 'authenticated'::text));

CREATE POLICY "activity_logs_all"
ON public.review_activity_logs
FOR ALL
TO public
USING (
EXISTS (
SELECT 1
FROM script_reviews r
WHERE r.id = review_activity_logs.script_review_id
AND r.user_id = auth.uid()
)
);

CREATE POLICY "review_assets_all"
ON public.review_assets
FOR ALL
TO public
USING (
EXISTS (
SELECT 1
FROM script_reviews r
WHERE r.id = review_assets.script_review_id
AND r.user_id = auth.uid()
)
);

CREATE POLICY "findings_insert"
ON public.review_findings
FOR INSERT
TO public
WITH CHECK (
EXISTS (
SELECT 1
FROM script_reviews r
WHERE r.id = review_findings.script_review_id
AND r.user_id = auth.uid()
)
);

CREATE POLICY "findings_select"
ON public.review_findings
FOR SELECT
TO public
USING (
EXISTS (
SELECT 1
FROM script_reviews r
WHERE r.id = review_findings.script_review_id
AND r.user_id = auth.uid()
)
);

CREATE POLICY "findings_update"
ON public.review_findings
FOR UPDATE
TO public
USING (
EXISTS (
SELECT 1
FROM script_reviews r
WHERE r.id = review_findings.script_review_id
AND r.user_id = auth.uid()
)
);

CREATE POLICY "rule_packs_select"
ON public.rule_packs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "reviews_all"
ON public.script_reviews
FOR ALL
TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Authenticated users can manage sla_profiles"
ON public.sla_profiles
FOR ALL
TO public
USING ((auth.role() = 'authenticated'::text))
WITH CHECK ((auth.role() = 'authenticated'::text));

CREATE POLICY "test_assets_all"
ON public.test_assets
FOR ALL
TO public
USING ((auth.uid() = user_id));

CREATE POLICY "user_settings_all"
ON public.user_settings
FOR ALL
TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Authenticated users can delete results assets"
ON storage.objects
FOR DELETE
TO public
USING (
(bucket_id = 'results-assets'::text)
AND (auth.role() = 'authenticated'::text)
);

CREATE POLICY "Authenticated users can read results assets"
ON storage.objects
FOR SELECT
TO public
USING (
(bucket_id = 'results-assets'::text)
AND (auth.role() = 'authenticated'::text)
);

CREATE POLICY "Authenticated users can update results assets"
ON storage.objects
FOR UPDATE
TO public
USING (
(bucket_id = 'results-assets'::text)
AND (auth.role() = 'authenticated'::text)
);

CREATE POLICY "Authenticated users can upload results assets"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
(bucket_id = 'results-assets'::text)
AND (auth.role() = 'authenticated'::text)
);

CREATE POLICY "script_assets_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
(bucket_id = 'script-assets'::text)
AND ((storage.foldername(name))[1] = (auth.uid())::text)
);

CREATE POLICY "script_assets_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
(bucket_id = 'script-assets'::text)
AND ((storage.foldername(name))[1] = (auth.uid())::text)
);

CREATE POLICY "script_assets_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
(bucket_id = 'script-assets'::text)
AND ((storage.foldername(name))[1] = (auth.uid())::text)
);

CREATE POLICY "script_assets_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
(bucket_id = 'script-assets'::text)
AND ((storage.foldername(name))[1] = (auth.uid())::text)
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_settings (user_id, ai_recommendation_mode, use_builtin_templates)
  VALUES (NEW.id, 'disabled', TRUE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE INDEX idx_script_reviews_user ON public.script_reviews USING btree (user_id);
CREATE INDEX idx_script_reviews_created ON public.script_reviews USING btree (created_at DESC);
CREATE INDEX idx_review_findings_review ON public.review_findings USING btree (script_review_id);
CREATE INDEX idx_test_assets_user ON public.test_assets USING btree (user_id);
CREATE INDEX executive_summary_library_exported_at_idx ON public.executive_summary_library USING btree (exported_at DESC);
CREATE INDEX idx_results_analyses_status ON public.results_analyses USING btree (status);
CREATE INDEX idx_results_analyses_created_at ON public.results_analyses USING btree (created_at DESC);

ALTER TABLE public.executive_summary_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_access_overrides ENABLE ROW LEVEL SECURITY;
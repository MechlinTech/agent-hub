-- Dev Scaffold Agent: job metadata + executor pairing tokens (no project files)

CREATE TABLE IF NOT EXISTS public.project_setups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  project_name text NOT NULL,
  project_scope text NOT NULL,
  location_path text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  progress_percent integer NOT NULL DEFAULT 0,
  current_step text,
  result jsonb,
  logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_setups_user_id_created_at_idx
  ON public.project_setups (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS project_setups_external_id_idx
  ON public.project_setups (external_id);

ALTER TABLE public.project_setups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own project setups"
ON public.project_setups
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.executor_pairing_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.executor_pairing_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own executor tokens"
ON public.executor_pairing_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Extend org_settings custom_roles entries with project_setup access (viewer read for custom roles default)
UPDATE public.org_settings
SET custom_roles = (
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN elem->'access' ? 'project_setup' THEN elem
        ELSE jsonb_set(
          elem,
          '{access,project_setup}',
          to_jsonb('read'::text),
          true
        )
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(COALESCE(custom_roles, '[]'::jsonb)) AS elem
)
WHERE custom_roles IS NOT NULL AND jsonb_array_length(COALESCE(custom_roles, '[]'::jsonb)) > 0;

CREATE TABLE public.user_access_overrides (
  user_id uuid NOT NULL,
  resource text NOT NULL CHECK (resource IN (
    'script_review', 'results_analysis', 'project_setup', 'integrations', 'settings', 'users'
  )),
  access_level text NOT NULL CHECK (access_level IN ('none', 'read', 'write')),
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_access_overrides_pkey PRIMARY KEY (user_id, resource),
  CONSTRAINT user_access_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_access_overrides_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

ALTER TABLE public.user_access_overrides
  DROP CONSTRAINT IF EXISTS user_access_overrides_resource_check;

ALTER TABLE public.user_access_overrides
  ADD CONSTRAINT user_access_overrides_resource_check
  CHECK (resource IN (
    'script_review', 'results_analysis', 'project_setup', 'integrations', 'settings', 'users'
  ));

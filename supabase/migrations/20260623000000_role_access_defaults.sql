ALTER TABLE public.org_settings
  ADD COLUMN IF NOT EXISTS role_access_defaults jsonb;

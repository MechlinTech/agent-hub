ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.org_settings
  ADD COLUMN IF NOT EXISTS custom_roles jsonb DEFAULT '[]'::jsonb;

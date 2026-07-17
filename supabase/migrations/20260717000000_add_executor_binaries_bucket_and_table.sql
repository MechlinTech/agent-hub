INSERT INTO storage.buckets (id, name, public)
VALUES ('executor_binaries', 'executor_binaries', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can read executor binaries"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'executor_binaries'::text
);

CREATE POLICY "Admin can manage executor binaries"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'executor_binaries'
  AND (
    public.is_admin() OR public.is_super_admin()
  )
)
WITH CHECK (
  bucket_id = 'executor_binaries'
  AND (
    public.is_admin() OR public.is_super_admin()
  )
);

CREATE TABLE IF NOT EXISTS public.executor_binaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  path text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS executor_binaries_version_idx ON public.executor_binaries (version);

ALTER TABLE public.executor_binaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage executor binaries"
ON public.executor_binaries
FOR ALL
TO authenticated
USING (
  public.is_admin() OR public.is_super_admin()
)
WITH CHECK (
  public.is_admin() OR public.is_super_admin()
);

CREATE POLICY "Users can view executor binaries"
ON public.executor_binaries
FOR SELECT
TO authenticated
USING (true);

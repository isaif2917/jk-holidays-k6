CREATE TABLE public.admin_known_passwords (
  user_id uuid PRIMARY KEY,
  password text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_known_passwords TO authenticated;
GRANT ALL ON public.admin_known_passwords TO service_role;

ALTER TABLE public.admin_known_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manages known passwords"
  ON public.admin_known_passwords
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
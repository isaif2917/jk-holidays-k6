CREATE TABLE public.custom_referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_referral_rewards TO authenticated;
GRANT ALL ON public.custom_referral_rewards TO service_role;

ALTER TABLE public.custom_referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manages custom referral rewards"
ON public.custom_referral_rewards
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
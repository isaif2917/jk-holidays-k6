-- Staff roles (manager, supervisor, operations manager, other) in addition to admin/member
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'other';
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_label text;

-- Public site settings: also expose the homepage hero image list
DROP POLICY IF EXISTS "public read site settings" ON public.admin_settings;
CREATE POLICY "public read site settings" ON public.admin_settings
FOR SELECT TO anon, authenticated
USING (key = ANY (ARRAY['site_name'::text, 'site_email'::text, 'site_phone'::text, 'site_address'::text, 'hero_images'::text]));

-- Admin-uploaded documents (membership details, T&C) visible to every signed-in member
CREATE TABLE public.site_documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_documents TO authenticated;
GRANT ALL ON public.site_documents TO service_role;
ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all site documents" ON public.site_documents FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "members read site documents" ON public.site_documents FOR SELECT TO authenticated USING (true);

-- Private documents bucket: admins upload/manage, signed-in members can read
CREATE POLICY "admin upload documents" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin manage documents" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin delete documents" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "members download documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

-- Referral reward engine: honour admin referral settings (fixed per plan, or percentage of payment)
CREATE OR REPLACE FUNCTION public.credit_referral_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  referrer_row public.referrals%ROWTYPE;
  amt numeric;
  mode text;
  val text;
  active text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'Approved' OR NEW.user_id IS NULL THEN RETURN NEW; END IF;
  SELECT value INTO active FROM public.admin_settings WHERE key = 'referral_active' LIMIT 1;
  IF active IS NOT NULL AND lower(active) = 'false' THEN RETURN NEW; END IF;
  SELECT * INTO referrer_row
  FROM public.referrals
  WHERE referred_user_id = NEW.user_id AND user_id <> NEW.user_id
  ORDER BY created_at
  LIMIT 1;
  IF referrer_row.id IS NULL THEN RETURN NEW; END IF;
  IF referrer_row.reward_amount IS NOT NULL THEN RETURN NEW; END IF;
  SELECT value INTO mode FROM public.admin_settings WHERE key = 'referral_mode' LIMIT 1;
  SELECT value INTO val FROM public.admin_settings WHERE key = 'referral_value' LIMIT 1;
  IF lower(coalesce(mode, 'fixed')) = 'percent' AND val ~ '^[0-9]+(\.[0-9]+)?$' THEN
    amt := round(NEW.amount * val::numeric / 100);
  ELSE
    SELECT p.referral_amount INTO amt
    FROM public.membership_plans p
    WHERE p.slug = NEW.plan_slug AND p.active
    LIMIT 1;
  END IF;
  IF amt IS NULL OR amt <= 0 THEN RETURN NEW; END IF;
  INSERT INTO public.wallet_transactions (user_id, type, amount, description)
  VALUES (referrer_row.user_id, 'credit', amt,
    'Referral reward: ' || NEW.plan_slug || ' membership for ' || coalesce(NEW.name, 'a new member'));
  UPDATE public.referrals SET status = 'Rewarded', reward_amount = amt WHERE id = referrer_row.id;
  RETURN NEW;
END
$function$;

ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS referral_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS reward_amount numeric;
COMMENT ON COLUMN public.membership_plans.referral_amount IS 'Wallet reward credited to the referrer when a referred member''s payment for this plan is approved';

CREATE OR REPLACE FUNCTION public.credit_referral_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  referrer_row public.referrals%ROWTYPE;
  amt numeric;
BEGIN
  IF NEW.status IS DISTINCT FROM 'Approved' OR NEW.user_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO referrer_row
  FROM public.referrals
  WHERE referred_user_id = NEW.user_id AND user_id <> NEW.user_id
  ORDER BY created_at
  LIMIT 1;
  IF referrer_row.id IS NULL THEN RETURN NEW; END IF;
  IF referrer_row.reward_amount IS NOT NULL THEN RETURN NEW; END IF;
  SELECT p.referral_amount INTO amt
  FROM public.membership_plans p
  WHERE p.slug = NEW.plan_slug AND p.active
  LIMIT 1;
  IF amt IS NULL OR amt <= 0 THEN RETURN NEW; END IF;
  INSERT INTO public.wallet_transactions (user_id, type, amount, description)
  VALUES (referrer_row.user_id, 'credit', amt,
    'Referral reward: ' || NEW.plan_slug || ' membership for ' || coalesce(NEW.name, 'a new member'));
  UPDATE public.referrals SET status = 'Rewarded', reward_amount = amt WHERE id = referrer_row.id;
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS credit_referral_reward_trigger ON public.payments;
CREATE TRIGGER credit_referral_reward_trigger
AFTER INSERT OR UPDATE OF status ON public.payments
FOR EACH ROW EXECUTE FUNCTION credit_referral_reward();

CREATE OR REPLACE FUNCTION public.notify_admin_holiday_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.admin_notifications (kind, title, body)
  VALUES ('request', 'New holiday request', 'A member requested ' || NEW.destination || ' (' || NEW.check_in || ' to ' || NEW.check_out || ').');
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS notify_admin_holiday_request_trigger ON public.holiday_requests;
CREATE TRIGGER notify_admin_holiday_request_trigger
AFTER INSERT ON public.holiday_requests
FOR EACH ROW EXECUTE FUNCTION notify_admin_holiday_request();

GRANT SELECT ON public.admin_settings TO anon, authenticated;
CREATE POLICY "public read site settings"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (key IN ('site_name', 'site_email', 'site_phone', 'site_address'));

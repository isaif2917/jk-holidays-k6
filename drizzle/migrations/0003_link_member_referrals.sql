ALTER TABLE public.referrals
  ADD COLUMN referred_user_id uuid;

CREATE UNIQUE INDEX referrals_referred_user_id_key
  ON public.referrals (referred_user_id)
  WHERE referred_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _referral_code text;
  _referrer_id uuid;
begin
  insert into public.profiles (id, full_name, email, phone, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'member')
  on conflict do nothing;

  _referral_code := upper(nullif(trim(new.raw_user_meta_data->>'referral_code'), ''));
  if _referral_code is not null and _referral_code ~ '^JKREF-[A-Z0-9]+$' then
    select p.id into _referrer_id
    from public.profiles p
    where upper(p.member_code) = substring(_referral_code from 7)
      and p.id <> new.id
    limit 1;

    if _referrer_id is not null then
      insert into public.referrals (user_id, referred_user_id, friend_name, friend_phone, status)
      values (
        _referrer_id,
        new.id,
        coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), new.email, 'New member'),
        new.raw_user_meta_data->>'phone',
        'Pending'
      )
      on conflict (referred_user_id) where referred_user_id is not null do nothing;
    end if;
  end if;

  return new;
end
$function$;
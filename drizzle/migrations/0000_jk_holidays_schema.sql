create type public.app_role as enum ('admin','member');

create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role public.app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', email text, phone text, city text, plan text,
  member_code text not null default ('JK' || lpad((floor(random()*1000000))::int::text, 6, '0')),
  status text not null default 'Pending', nights_total int not null default 0, nights_used int not null default 0,
  membership_start date, membership_end date, created_at timestamptz not null default now());
grant select, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "read own or admin" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "update own or admin" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- members cannot change their own plan/status/nights
create or replace function public.protect_profile_fields() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(),'admin') then
    new.plan := old.plan; new.status := old.status; new.member_code := old.member_code;
    new.nights_total := old.nights_total; new.nights_used := old.nights_used;
    new.membership_start := old.membership_start; new.membership_end := old.membership_end;
  end if;
  return new;
end $$;
create trigger protect_profile before update on public.profiles for each row execute function public.protect_profile_fields();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, city)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email, new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'city')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'member') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- member-owned tables
create table public.holiday_requests (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), code text not null default ('HR' || lpad((floor(random()*1000000))::int::text,6,'0')), destination text not null, resort text, check_in date not null, check_out date not null, nights int not null default 1, rooms int not null default 1, travellers jsonb not null default '[]', extras jsonb not null default '{}', special_requests text, alt_dates text, status text not null default 'Pending', admin_note text, created_at timestamptz not null default now());
create table public.bookings (id uuid primary key default gen_random_uuid(), user_id uuid, request_id uuid, client_name text, client_email text, client_mobile text, destination text not null, resort text, check_in date not null, check_out date not null, nights int not null default 1, status text not null default 'Confirmed', notes text, created_at timestamptz not null default now());
create table public.documents (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), name text not null, path text not null, created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null, title text not null, body text, read boolean not null default false, created_at timestamptz not null default now());
create table public.payments (id uuid primary key default gen_random_uuid(), user_id uuid default auth.uid(), name text, email text, phone text, plan_slug text not null, amount numeric not null default 0, method text not null default 'UPI', reference text not null default '', status text not null default 'Pending', created_at timestamptz not null default now());
create table public.referrals (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), friend_name text not null, friend_phone text not null, status text not null default 'Pending', created_at timestamptz not null default now());
create table public.support_tickets (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), subject text not null, message text not null, status text not null default 'Open', admin_reply text, created_at timestamptz not null default now());
create table public.wallet_transactions (id uuid primary key default gen_random_uuid(), user_id uuid not null, type text not null default 'credit', amount numeric not null default 0, description text not null default '', created_at timestamptz not null default now());
create table public.withdrawals (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), amount numeric not null default 0, method text not null default 'Bank', details jsonb not null default '{}', status text not null default 'Pending', remarks text, created_at timestamptz not null default now());

grant select, insert, update, delete on public.holiday_requests, public.bookings, public.documents, public.notifications, public.payments, public.referrals, public.support_tickets, public.wallet_transactions, public.withdrawals to authenticated;
grant all on public.holiday_requests, public.bookings, public.documents, public.notifications, public.payments, public.referrals, public.support_tickets, public.wallet_transactions, public.withdrawals to service_role;

alter table public.holiday_requests enable row level security;
alter table public.bookings enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;
alter table public.referrals enable row level security;
alter table public.support_tickets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawals enable row level security;

-- admin full access everywhere; members read own
do $$ declare t text; begin
  foreach t in array array['holiday_requests','bookings','documents','notifications','payments','referrals','support_tickets','wallet_transactions','withdrawals'] loop
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "read own" on public.%I for select to authenticated using (user_id = auth.uid())', t);
  end loop;
end $$;
-- members create their own requests
create policy "insert own" on public.holiday_requests for insert to authenticated with check (user_id = auth.uid());
create policy "insert own" on public.documents for insert to authenticated with check (user_id = auth.uid());
create policy "delete own" on public.documents for delete to authenticated using (user_id = auth.uid());
create policy "insert own" on public.payments for insert to authenticated with check (user_id = auth.uid());
create policy "insert own" on public.referrals for insert to authenticated with check (user_id = auth.uid());
create policy "insert own" on public.support_tickets for insert to authenticated with check (user_id = auth.uid());
create policy "insert own" on public.withdrawals for insert to authenticated with check (user_id = auth.uid());
create policy "mark read" on public.notifications for update to authenticated using (user_id = auth.uid());

-- public catalogue tables
create table public.membership_plans (id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, nights int not null default 0, validity_years int not null default 1, price numeric not null default 0, original_price numeric not null default 0, features text[] not null default '{}', active boolean not null default true, sort int not null default 0);
create table public.resorts (id uuid primary key default gen_random_uuid(), name text not null, location text not null, description text, image_url text, rating numeric not null default 5, status text not null default 'Active', created_at timestamptz not null default now());
create table public.offers (id uuid primary key default gen_random_uuid(), title text not null, description text, discount text, valid_till date, active boolean not null default true, created_at timestamptz not null default now());
create table public.admin_settings (key text primary key, value text not null default '', updated_at timestamptz not null default now());
create table public.leads (id uuid primary key default gen_random_uuid(), name text not null, phone text not null, email text, interest text, message text, status text not null default 'New', created_at timestamptz not null default now());

grant select on public.membership_plans, public.resorts, public.offers to anon;
grant select, insert, update, delete on public.membership_plans, public.resorts, public.offers, public.admin_settings, public.leads to authenticated;
grant insert on public.leads to anon;
grant all on public.membership_plans, public.resorts, public.offers, public.admin_settings, public.leads to service_role;

alter table public.membership_plans enable row level security;
alter table public.resorts enable row level security;
alter table public.offers enable row level security;
alter table public.admin_settings enable row level security;
alter table public.leads enable row level security;

create policy "public read" on public.membership_plans for select to anon, authenticated using (true);
create policy "public read" on public.resorts for select to anon, authenticated using (true);
create policy "public read" on public.offers for select to anon, authenticated using (true);
create policy "anyone can enquire" on public.leads for insert to anon, authenticated with check (true);
do $$ declare t text; begin
  foreach t in array array['membership_plans','resorts','offers','admin_settings','leads'] loop
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

insert into public.membership_plans (slug, name, nights, validity_years, price, original_price, features, sort) values
('silver','Silver',2,1,15000,30000, array['Premium Resort Stay','Member Exclusive Holiday Offers','Customer Support'],1),
('gold','Gold',4,2,25000,50000, array['Premium Resort Stay','Priority Member Support','Exclusive Member Discounts','Seasonal Member Offers'],2),
('platinum','Platinum',10,5,50000,100000, array['Premium Resort Stay','Priority Booking','Exclusive Member Benefits','FREE Bali or Thailand Trip','VIP Customer Support'],3);
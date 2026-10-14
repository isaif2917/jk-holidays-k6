create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  location text check (char_length(location) <= 80),
  message text not null check (char_length(message) between 5 and 600),
  rating int not null default 5 check (rating between 1 and 5),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "public reads approved" on public.reviews for select to anon, authenticated using (approved = true);
create policy "anyone submits pending" on public.reviews for insert to anon, authenticated with check (approved = false);
create policy "admin all" on public.reviews for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
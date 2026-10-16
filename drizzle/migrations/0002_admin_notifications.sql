CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all" ON public.admin_notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.notify_admin_new_member() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  insert into public.admin_notifications (kind, title, body)
  values ('member', 'New member registered', coalesce(nullif(new.full_name,''), new.email, 'A new member') || ' (' || new.member_code || ') just signed up.');
  return new;
end $$;
CREATE TRIGGER notify_admin_new_member AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_member();

CREATE OR REPLACE FUNCTION public.notify_admin_payment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if tg_op = 'INSERT' then
    insert into public.admin_notifications (kind, title, body)
    values ('membership', 'New membership request', coalesce(new.name, new.email, 'A member') || ' requested the ' || new.plan_slug || ' plan (₹' || new.amount || ').');
  elsif new.status = 'Approved' and old.status is distinct from 'Approved' then
    insert into public.admin_notifications (kind, title, body)
    values ('membership', 'Membership activated', coalesce(new.name, new.email, 'A member') || ' is now on the ' || new.plan_slug || ' plan.');
  end if;
  return new;
end $$;
CREATE TRIGGER notify_admin_payment AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_payment();

CREATE OR REPLACE FUNCTION public.notify_admin_ticket() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  insert into public.admin_notifications (kind, title, body)
  values ('ticket', 'New support ticket', new.subject);
  return new;
end $$;
CREATE TRIGGER notify_admin_ticket AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_ticket();
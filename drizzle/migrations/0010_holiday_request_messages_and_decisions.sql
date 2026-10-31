ALTER TABLE public.holiday_requests
  ADD COLUMN admin_action_at timestamptz,
  ADD COLUMN alt_decision text,
  ADD COLUMN alt_decided_at timestamptz;

CREATE TABLE public.request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.holiday_requests(id) on delete cascade,
  sender text not null check (sender in ('admin','member')),
  body text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT ON public.request_messages TO authenticated;
GRANT ALL ON public.request_messages TO service_role;
ALTER TABLE public.request_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read own thread" ON public.request_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.holiday_requests hr WHERE hr.id = request_id AND hr.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "member posts own thread" ON public.request_messages FOR INSERT TO authenticated
  WITH CHECK (sender = 'member' AND EXISTS (SELECT 1 FROM public.holiday_requests hr WHERE hr.id = request_id AND hr.user_id = auth.uid()));
CREATE POLICY "admin all messages" ON public.request_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Members may only record their decision on proposed alternate dates.
GRANT UPDATE (alt_decision, alt_decided_at) ON public.holiday_requests TO authenticated;
CREATE POLICY "member sets alt decision" ON public.holiday_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notify the other side whenever a message is posted.
CREATE OR REPLACE FUNCTION public.notify_request_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.holiday_requests WHERE id = NEW.request_id;
  IF NEW.sender = 'member' THEN
    INSERT INTO public.admin_notifications (kind, title, body) VALUES ('info', 'Reply on holiday request ' || r.code, left(NEW.body, 300));
  ELSE
    INSERT INTO public.notifications (user_id, title, body) VALUES (r.user_id, 'Message from JK Holidays team', left(NEW.body, 300));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER notify_request_message AFTER INSERT ON public.request_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_request_message();

-- Notify admins when a member decides on the proposed alternate dates.
CREATE OR REPLACE FUNCTION public.notify_alt_decision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.alt_decision IS DISTINCT FROM OLD.alt_decision AND NEW.alt_decision IS NOT NULL THEN
    INSERT INTO public.admin_notifications (kind, title, body) VALUES ('info', 'Member ' || lower(NEW.alt_decision) || ' alternate dates on ' || NEW.code, 'Decision recorded at ' || to_char(now(), 'DD Mon YYYY, HH12:MI AM'));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER notify_alt_decision AFTER UPDATE OF alt_decision ON public.holiday_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_alt_decision();
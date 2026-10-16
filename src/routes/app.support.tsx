import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Headphones } from "lucide-react";
import { CONTACT } from "@/data/mock";
import { db, fmtDate, useMe, useRefresh, useRows } from "@/lib/data";

export const Route = createFileRoute("/app/support")({ component: Support });

function Support() {
  const { data: me } = useMe();
  const uid = me?.user.id;
  const refresh = useRefresh();
  const tickets = useRows(["support_tickets", uid], () => db.from("support_tickets").select("*").eq("user_id", uid).order("created_at", { ascending: false }), !!uid);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const s = subject.trim(), m = message.trim();
    if (!s || !m) return toast.error("Enter a subject and describe your issue");
    if (s.length > 150 || m.length > 2000) return toast.error("Message is too long");
    setBusy(true);
    const { error } = await db.from("support_tickets").insert({ user_id: uid, subject: s, message: m });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Ticket submitted. Our team will reply soon.");
    setSubject(""); setMessage("");
    refresh("support_tickets");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Travel Support</h1>
      <Card className="p-6">
        <div className="flex items-center gap-3"><Headphones className="h-8 w-8 text-gold" /><div><div className="font-semibold text-navy">24/7 Member Support</div><div className="text-sm text-muted-foreground">Call {CONTACT.phone} or submit a ticket</div></div></div>
        <div className="mt-6 space-y-3">
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} />
          <Textarea rows={5} placeholder="Describe your issue..." value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
          <Button disabled={busy} onClick={submit} className="bg-gold-gradient font-bold text-navy-deep">{busy ? "Submitting…" : "SUBMIT TICKET"}</Button>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="font-serif text-lg font-bold text-navy">My Tickets</h3>
        <div className="mt-4 space-y-3">
          {(tickets.data ?? []).length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No tickets yet.</div>}
          {(tickets.data ?? []).map((t: any) => (
            <div key={t.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><div className="font-semibold text-navy">{t.subject}</div><div className="text-xs text-muted-foreground">{fmtDate(t.created_at)}</div></div>
                <StatusBadge s={t.status} />
              </div>
              <p className="mt-2 whitespace-pre-line text-sm">{t.message}</p>
              {t.admin_reply && (
                <div className="mt-3 rounded-md bg-muted p-3 text-sm"><div className="text-xs font-semibold text-navy">Reply from JK Holidays</div><p className="mt-1 whitespace-pre-line">{t.admin_reply}</p></div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

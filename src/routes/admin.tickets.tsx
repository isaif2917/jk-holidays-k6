import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, fmtDate, useProfilesMap, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/tickets")({ head: () => createRouteHead("Support Tickets — JK Holidays Admin", "Review support tickets and respond to member requests."), component: Tickets });

const TICKET_STATUSES = ["Open", "In Progress", "Resolved"];
const shortId = (id: string) => "TKT-" + id.slice(0, 5).toUpperCase();

function Tickets() {
  const refresh = useRefresh();
  const { map } = useProfilesMap();
  const q = useRows("support_tickets", () => db.from("support_tickets").select("*").order("created_at", { ascending: false }));
  const [replies, setReplies] = useState<Record<string, string>>({});

  const update = async (t: any, patch: { status?: string; admin_reply?: string }, note: string) => {
    const { error } = await db.from("support_tickets").update(patch).eq("id", t.id);
    if (error) return toast.error(error.message);
    await db.from("notifications").insert({ user_id: t.user_id, title: `Support ticket: ${t.subject}`, body: note });
    toast.success("Ticket updated");
    setReplies((r) => ({ ...r, [t.id]: "" }));
    refresh("support_tickets");
  };

  const setStatus = async (t: any, status: string) => {
    if (!TICKET_STATUSES.includes(status)) return;
    await update(t, { status }, `Your ticket status is now ${status}.`);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Support Tickets</h1>
      {(q.data ?? []).length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No tickets yet.</Card>}
      <div className="space-y-4">
        {(q.data ?? []).map((t: any) => {
          const p = map[t.user_id];
          const reply = replies[t.id] ?? "";
          return (
            <Card key={t.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{shortId(t.id)}</span>
                    <span className="font-semibold text-navy">{t.subject}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    User: {p?.full_name || p?.email || "Member"} · Member ID: {p?.member_code || "—"} · Raised {fmtDate(t.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge s={t.status} />
                  <Select value={TICKET_STATUSES.includes(t.status) ? t.status : undefined} onValueChange={(v) => setStatus(t, v)}>
                    <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Update status" /></SelectTrigger>
                    <SelectContent>{TICKET_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{t.message}</p>
              {t.admin_reply && <div className="mt-3 rounded-md bg-muted p-3 text-sm"><span className="text-xs font-semibold text-navy">Your reply: </span>{t.admin_reply}</div>}
              <Textarea className="mt-3" rows={2} placeholder="Write a reply to the member…" value={reply} maxLength={2000}
                onChange={(e) => setReplies((r) => ({ ...r, [t.id]: e.target.value }))} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="bg-navy text-white" disabled={!reply.trim()}
                  onClick={() => update(t, { admin_reply: reply.trim() }, reply.trim())}>Reply</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { db, fmtDate, useProfilesMap, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/tickets")({ head: () => createRouteHead("Support Tickets — JK Holidays Admin", "Review support tickets and respond to member requests."), component: Tickets });

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
                  <div className="font-semibold text-navy">{t.subject}</div>
                  <div className="text-xs text-muted-foreground">{p?.full_name || p?.email || "Member"} · {p?.member_code} · {fmtDate(t.created_at)}</div>
                </div>
                <StatusBadge s={t.status} />
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{t.message}</p>
              {t.admin_reply && <div className="mt-3 rounded-md bg-muted p-3 text-sm"><span className="text-xs font-semibold text-navy">Your reply: </span>{t.admin_reply}</div>}
              <Textarea className="mt-3" rows={2} placeholder="Write a reply to the member…" value={reply} maxLength={2000}
                onChange={(e) => setReplies((r) => ({ ...r, [t.id]: e.target.value }))} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="bg-navy text-white" disabled={!reply.trim()}
                  onClick={() => update(t, { admin_reply: reply.trim(), status: t.status === "Open" ? "Replied" : t.status }, reply.trim())}>Reply</Button>
                <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => update(t, { status: "Approved", ...(reply.trim() ? { admin_reply: reply.trim() } : {}) }, reply.trim() || "Your ticket has been approved.")}>Approve</Button>
                <Button size="sm" variant="destructive"
                  onClick={() => update(t, { status: "Rejected", ...(reply.trim() ? { admin_reply: reply.trim() } : {}) }, reply.trim() || "Your ticket has been rejected.")}>Reject</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

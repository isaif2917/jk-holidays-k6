import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { db, fmtDate, useMe, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/notifications")({ head: () => createRouteHead("My Notifications — JK Holidays", "View updates about your JK Holidays account and travel requests."), component: Notifications });

function Notifications() {
  const { data: me } = useMe();
  const refresh = useRefresh();
  const q = useRows(["notifications", me?.user.id], () => db.from("notifications").select("*").eq("user_id", me!.user.id).order("created_at", { ascending: false }), !!me?.user.id);
  const rows = q.data ?? [];
  const unread = rows.filter((n: any) => !n.read);
  const markRead = async () => {
    const { error } = await db.from("notifications").update({ read: true }).eq("user_id", me!.user.id).eq("read", false);
    if (error) return toast.error(error.message);
    refresh("notifications");
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-navy">Notifications</h1>
        {unread.length > 0 && <button onClick={markRead} className="text-xs font-semibold text-blue-600">Mark all read ({unread.length})</button>}
      </div>
      <Card className="p-5">
        {rows.map((n: any) => (
          <div key={n.id} className="flex items-start gap-3 border-b py-3 last:border-0">
            <Bell className="mt-1 h-4 w-4 shrink-0 text-gold" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm text-navy"><span className="font-semibold">{n.title}</span>{!n.read && <span className="h-2 w-2 rounded-full bg-red-500" />}</div>
              {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(n.created_at)}</span>
          </div>
        ))}
        {!rows.length && <div className="py-10 text-center text-sm text-muted-foreground">No notifications yet. Updates about your membership, requests and rewards will appear here.</div>}
      </Card>
    </div>
  );
}


import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { UserPlus, Crown, LifeBuoy, Bell } from "lucide-react";
import { db, useRefresh, useRows } from "@/lib/data";

export const Route = createFileRoute("/admin/notifications")({ component: AdminNotifications });

const icons: Record<string, typeof Bell> = { member: UserPlus, membership: Crown, ticket: LifeBuoy };

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

function AdminNotifications() {
  const refresh = useRefresh();
  const q = useRows("admin_notifications_all", () => db.from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(200));
  const hasUnread = (q.data ?? []).some((n: any) => !n.read);
  useEffect(() => {
    if (!hasUnread) return;
    const t = setTimeout(async () => {
      await db.from("admin_notifications").update({ read: true }).eq("read", false);
      refresh("admin_notifications");
    }, 1500);
    return () => clearTimeout(t);
  }, [hasUnread]);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Notifications</h1>
      <Card className="p-5">
        {(q.data ?? []).length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No notifications yet. New sign-ups and membership requests will appear here.</div>}
        {(q.data ?? []).map((n: any) => {
          const Icon = icons[n.kind] ?? Bell;
          return (
            <div key={n.id} className="flex items-start gap-3 border-b py-3 last:border-0">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-navy"><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-semibold text-navy">{n.title}{!n.read && <span className="h-2 w-2 rounded-full bg-red-500" />}</div>
                {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{ago(n.created_at)}</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

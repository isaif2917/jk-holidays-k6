import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { db, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/resorts")({ head: () => createRouteHead("Resorts Directory — JK Holidays", "Browse resort destinations available to JK Holidays members."), component: Resorts });

function Resorts() {
  const q = useRows<any>("resorts", () => db.from("resorts").select("*").neq("status", "Draft").order("created_at", { ascending: false }));
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Resorts Directory</h1>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((r) => (
            <Card key={r.id} className="overflow-hidden p-0">
              {r.image_url ? <img src={r.image_url} alt={r.name} className="h-40 w-full object-cover" /> : <div className="h-40 bg-muted" />}
              <div className="p-4">
                <div className="font-serif text-lg font-bold text-navy">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.location} · ★ {r.rating}</div>
                {r.description && <p className="mt-2 text-xs text-muted-foreground">{r.description}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

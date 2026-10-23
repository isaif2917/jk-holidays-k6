import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { FileText, Download, FileX } from "lucide-react";
import { db, fmtDate, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/documents")({ head: () => createRouteHead("My Documents — JK Holidays", "Download membership details, terms and other documents shared by JK Holidays."), component: Documents });

function Documents() {
  const q = useRows("site_documents", () => db.from("site_documents").select("*").order("created_at", { ascending: false }));
  const docs = q.data ?? [];

  const download = async (d: any) => {
    const { data, error } = await db.storage.from("documents").createSignedUrl(d.path, 60, { download: d.name });
    if (error || !data) return toast.error("Could not open the file");
    try {
      const res = await fetch(data.signedUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = d.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
    } catch { toast.error("Could not download the file"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Documents</h1>
      <Card className="p-5">
        {docs.map((d: any) => (
          <div key={d.id} className="flex items-center justify-between border-b py-3 last:border-0">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-gold" />
              <div className="min-w-0">
                <div className="truncate text-sm text-navy">{d.name}</div>
                <div className="text-xs text-muted-foreground">Shared {fmtDate(d.created_at)}</div>
              </div>
            </div>
            <button className="flex items-center gap-1 text-blue-600" onClick={() => download(d)}><Download className="h-4 w-4" /> Download</button>
          </div>
        ))}
        {!docs.length && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <FileX className="h-8 w-8 text-muted-foreground/60" />
            No documents have been shared yet. Membership details and terms shared by our team will appear here.
          </div>
        )}
      </Card>
    </div>
  );
}

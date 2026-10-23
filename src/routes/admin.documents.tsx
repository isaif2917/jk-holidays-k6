import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, FileX } from "lucide-react";
import { db, fmtDate, useRefresh, useRows } from "@/lib/data";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/documents")({ head: () => createRouteHead("Documents — JK Holidays Admin", "Upload membership details, terms and conditions for members to download."), component: AdminDocuments });

function AdminDocuments() {
  const refresh = useRefresh();
  const q = useRows("site_documents", () => db.from("site_documents").select("*").order("created_at", { ascending: false }));
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const docs = q.data ?? [];

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error: upErr } = await db.storage.from("documents").upload(path, file, { contentType: file.type || "application/pdf" });
      if (upErr) throw new Error(upErr.message);
      const { error } = await db.from("site_documents").insert({ name: file.name, path });
      if (error) { await db.storage.from("documents").remove([path]); throw new Error(error.message); }
      toast.success(`${file.name} is now available to all members.`);
      refresh("site_documents");
    } catch (e: any) { toast.error(e?.message ?? "Upload failed"); } finally { setBusy(false); }
  };

  const remove = async (d: any) => {
    if (!confirm(`Remove "${d.name}" for all members?`)) return;
    const { error } = await db.from("site_documents").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    await db.storage.from("documents").remove([d.path]);
    toast.success("Document removed");
    refresh("site_documents");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy">Documents</h1>
          <div className="text-sm text-muted-foreground">Upload PDFs like membership details and terms & conditions — members see them under My Documents.</div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <Button disabled={busy} className="bg-navy text-white" onClick={() => fileRef.current?.click()}><Upload className="mr-1 h-4 w-4" />{busy ? "Uploading…" : "Upload document"}</Button>
      </div>
      <Card className="p-5">
        {docs.map((d: any) => (
          <div key={d.id} className="flex items-center justify-between border-b py-3 last:border-0">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-gold" />
              <div className="min-w-0"><div className="truncate text-sm font-medium text-navy">{d.name}</div><div className="text-xs text-muted-foreground">Uploaded {fmtDate(d.created_at)}</div></div>
            </div>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(d)}><Trash2 className="mr-1 h-3.5 w-3.5" /> Remove</Button>
          </div>
        ))}
        {!docs.length && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <FileX className="h-8 w-8 text-muted-foreground/60" />
            Nothing uploaded yet. Uploaded files appear in every member's Documents page.
          </div>
        )}
      </Card>
    </div>
  );
}

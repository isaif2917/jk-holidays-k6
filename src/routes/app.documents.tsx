import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { createRouteHead } from "@/lib/route-meta";
export const Route = createFileRoute("/app/documents")({ head: () => createRouteHead("My Documents — JK Holidays", "Access your JK Holidays membership documents and receipts."), component: () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-navy">Documents</h1>
    <Card className="p-5">
      {["Membership Agreement.pdf", "Payment Receipt - JK784561.pdf", "Terms & Conditions.pdf"].map((f) => (
        <div key={f} className="flex items-center justify-between border-b py-3 last:border-0">
          <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-gold" /><span className="text-sm text-navy">{f}</span></div>
          <button className="text-blue-600"><Download className="h-4 w-4" /></button>
        </div>
      ))}
    </Card>
  </div>
)});

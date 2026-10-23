import { Badge } from "@/components/ui/badge";

const map: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Open: "bg-amber-100 text-amber-700",
  Invited: "bg-amber-100 text-amber-700",
  New: "bg-blue-100 text-blue-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Verified: "bg-emerald-100 text-emerald-700",
  Confirmed: "bg-emerald-100 text-emerald-700",
  Active: "bg-emerald-100 text-emerald-700",
  Resolved: "bg-emerald-100 text-emerald-700",
  Joined: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
  In Progress: "bg-blue-100 text-blue-700",
  Replied: "bg-blue-100 text-blue-700",
  Rewarded: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
  Inactive: "bg-rose-100 text-rose-700",
  Completed: "bg-blue-100 text-blue-700",
  Contacted: "bg-blue-100 text-blue-700",
  Paid: "bg-blue-100 text-blue-700",
  Published: "bg-emerald-500 text-white",
  Draft: "bg-white text-slate-800",
};

export function StatusBadge({ s }: { s: string }) {
  const c = map[s] ?? "bg-slate-100 text-slate-700";
  return <Badge className={`${c} hover:${c}`}>{s}</Badge>;
}

import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
export const Route = createFileRoute("/admin/roles")({ component: () => (
  <div className="space-y-6">
    <div className="flex justify-between"><h1 className="font-serif text-3xl font-bold text-navy">Admins & Roles</h1><Button className="bg-navy text-white">+ Add Admin</Button></div>
    <Card className="p-5"><table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2">Admin</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>{[
      { n: "Admin User", e: "admin@jkholidays.com", r: "Super Admin" },
      { n: "Priya Kaur", e: "priya@jkholidays.com", r: "Manager" },
      { n: "Rohit Jain", e: "rohit@jkholidays.com", r: "Support" },
    ].map((a) => (
      <tr key={a.e} className="border-b"><td className="py-3 font-medium text-navy">{a.n}</td><td>{a.e}</td><td><Badge>{a.r}</Badge></td><td><span className="text-emerald-600">● Active</span></td></tr>
    ))}</tbody></table></Card>
  </div>
)});

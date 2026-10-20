import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createRouteHead } from "@/lib/route-meta";
export const Route = createFileRoute("/admin/settings")({ head: () => createRouteHead("Settings — JK Holidays Admin", "Manage JK Holidays contact and site settings."), component: () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-navy">Settings</h1>
    <Card className="p-6 space-y-4">
      <div><label className="text-sm font-semibold">Site Name</label><Input defaultValue="JK Holidays" className="mt-1" /></div>
      <div><label className="text-sm font-semibold">Support Email</label><Input defaultValue="jkholiday27@gmail.com" className="mt-1" /></div>
      <div><label className="text-sm font-semibold">Support Phone</label><Input defaultValue="+91 90123 45678" className="mt-1" /></div>
      <Button className="bg-gold-gradient font-bold text-navy-deep">SAVE SETTINGS</Button>
    </Card>
  </div>
)});

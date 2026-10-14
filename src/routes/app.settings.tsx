import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/app/settings")({ component: () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-navy">Settings</h1>
    <Card className="p-6 space-y-4">
      <div><label className="text-sm font-semibold text-navy">Change Password</label><Input type="password" className="mt-1" /></div>
      <div><label className="text-sm font-semibold text-navy">Language</label><Input defaultValue="English" className="mt-1" /></div>
      <Button className="bg-gold-gradient font-bold text-navy-deep">SAVE</Button>
    </Card>
  </div>
)});

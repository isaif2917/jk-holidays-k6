import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Headphones } from "lucide-react";
export const Route = createFileRoute("/app/support")({ component: () => (
  <div className="space-y-6">
    <h1 className="font-serif text-3xl font-bold text-navy">Travel Support</h1>
    <Card className="p-6">
      <div className="flex items-center gap-3"><Headphones className="h-8 w-8 text-gold" /><div><div className="font-semibold text-navy">24/7 Member Support</div><div className="text-sm text-muted-foreground">Call +91 90123 45678 or submit a ticket</div></div></div>
      <div className="mt-6 space-y-3">
        <Input placeholder="Subject" />
        <Textarea rows={5} placeholder="Describe your issue..." />
        <Button className="bg-gold-gradient font-bold text-navy-deep">Submit Ticket</Button>
      </div>
    </Card>
  </div>
)});

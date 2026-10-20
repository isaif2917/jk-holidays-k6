import { createFileRoute } from "@tanstack/react-router";
import { destinations } from "@/data/mock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/holidays")({ head: () => createRouteHead("Available Holidays — JK Holidays", "Explore holiday destinations available to JK Holidays members."), component: Holidays });

function Holidays() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-navy">Available Holidays</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {destinations.map((d) => (
          <Card key={d.name} className="overflow-hidden p-0">
            <img src={d.image} alt={d.name} className="h-48 w-full object-cover" />
            <div className="p-4">
              <div className="font-serif text-lg font-bold text-navy">{d.name}</div>
              <div className="text-xs text-muted-foreground">{d.country}</div>
              <Button className="mt-3 w-full bg-navy text-white">Book Now</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

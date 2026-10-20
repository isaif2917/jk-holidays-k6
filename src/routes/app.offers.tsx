import { createFileRoute } from "@tanstack/react-router";
import { OfferCards } from "@/components/OfferCards";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/app/offers")({ head: () => createRouteHead("Member Offers — JK Holidays", "Browse current holiday offers and discounts for members."), component: MemberOffers });

function MemberOffers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-navy">Offers & Discounts</h1>
        <p className="text-sm text-muted-foreground">Latest holiday offers for members.</p>
      </div>
      <div className="pb-16"><OfferCards bookTo="/app/request" /></div>
    </div>
  );
}

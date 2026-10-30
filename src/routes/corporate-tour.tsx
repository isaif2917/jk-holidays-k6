import { createFileRoute } from "@tanstack/react-router";
import { TourPage } from "@/components/TourPage";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/corporate-tour")({
  head: () => createRouteHead("Corporate Tours — JK Holidays", "Offsites, incentive trips and corporate retreats planned end to end by JK Holidays."),
  component: () => (
    <TourPage
      kind="corporate"
      title="Corporate Tours"
      intro="Reward, recharge and reconnect. From team offsites to incentive trips, we plan corporate tours end to end — venues, travel, activities and downtime, all handled for you."
      bullets={[
        "Offsites, retreats and incentive trips tailored to your team size and goals.",
        "Conference-ready resorts, transfers and curated team activities.",
        "Single point of contact with clear budgets and a published itinerary.",
      ]}
    />
  ),
});

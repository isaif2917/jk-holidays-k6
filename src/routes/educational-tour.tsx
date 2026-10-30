import { createFileRoute } from "@tanstack/react-router";
import { TourPage } from "@/components/TourPage";
import { createRouteHead } from "@/lib/route-meta";

export const Route = createFileRoute("/educational-tour")({
  head: () => createRouteHead("Educational Tours — JK Holidays", "Curated educational tour packages for schools, colleges and student groups."),
  component: () => (
    <TourPage
      kind="educational"
      title="Educational Tours"
      intro="Learning beyond the classroom. We organise safe, well-planned educational tours for schools, colleges and institutions — with verified stays, guided visits and dedicated coordinators."
      bullets={[
        "Destinations and itineraries matched to your syllabus and age group.",
        "Verified resorts and transport with trained tour coordinators throughout.",
        "Transparent group pricing with documents shared in advance for approvals.",
      ]}
    />
  ),
});

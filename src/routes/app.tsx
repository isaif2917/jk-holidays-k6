import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/layouts/PortalLayout";
import { createRouteHead } from "@/lib/route-meta";
export const Route = createFileRoute("/app")({ ssr: false, head: () => createRouteHead("Member Portal — JK Holidays", "Manage your JK Holidays account, membership and travel."), component: PortalLayout });

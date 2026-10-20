import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { createRouteHead } from "@/lib/route-meta";
export const Route = createFileRoute("/admin")({ ssr: false, head: () => createRouteHead("Admin Portal — JK Holidays", "Manage JK Holidays membership, bookings and support."), component: AdminLayout });

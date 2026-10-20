import { Outlet, createFileRoute } from "@tanstack/react-router";
import { createRouteHead } from "@/lib/route-meta";
export const Route = createFileRoute("/auth")({ head: () => createRouteHead("Account Access — JK Holidays", "Sign in or create your JK Holidays member account."), component: () => <Outlet /> });

import { createFileRoute } from "@tanstack/react-router";

/** Whitelisted settings keys; the handler only ever serves the stored tour brochure. */
const KEYS: Record<string, string> = {
  educational: "educational_tour_doc",
  corporate: "corporate_tour_doc",
};

export const Route = createFileRoute("/api/public/tour-doc")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = new URL(request.url).searchParams.get("key") ?? "";
        const settingsKey = KEYS[key];
        if (!settingsKey) return new Response("Not found", { status: 404 });

        // Route files ship to the client bundle, so load the privileged client inside the handler.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: row } = await supabaseAdmin.from("admin_settings").select("value").eq("key", settingsKey).maybeSingle();
        let doc: { name?: string; path?: string; type?: string } | null = null;
        try { doc = JSON.parse(row?.value ?? "null"); } catch { doc = null; }
        if (!doc || typeof doc.path !== "string" || !doc.path.startsWith("tour-docs/") || doc.path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const { data, error } = await supabaseAdmin.storage.from("documents").download(doc.path);
        if (error || !data) return new Response("Not found", { status: 404 });

        const filename = encodeURIComponent(doc.name || "tour-document");
        return new Response(data, {
          headers: {
            "Content-Type": typeof doc.type === "string" && doc.type ? doc.type : "application/octet-stream",
            "Content-Disposition": `inline; filename="${filename}"`,
            "Cache-Control": "public, max-age=60",
          },
        });
      },
    },
  },
});

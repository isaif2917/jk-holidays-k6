// Supabase clients for edge functions.
//
// Mirrors the header handling in src/integrations/supabase/client.server.ts: the new
// opaque API keys (sb_publishable_* / sb_secret_*) are NOT bearer JWTs, so supabase-js
// putting them in Authorization breaks requests. Strip that and send `apikey` instead.
//
// Pinned >= 2.117 because auth.getClaims() is required. If this specifier fails at
// deploy time, try npm:@supabase/supabase-js@2 then jsr:@supabase/supabase-js@2.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";

export function env(name: string): string {
  return Deno.env.get(name) ?? "";
}

export function supabaseUrl(): string {
  return env("SUPABASE_URL");
}

/** Lovable may expose the public key under either name; prefer whichever is populated. */
export function publishableKey(): string {
  return env("SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_ANON_KEY");
}

export function serviceRoleKey(): string {
  return env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_SECRET_KEY");
}

function isOpaqueKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function keyedFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, name) => headers.set(name, value));
    }
    if (isOpaqueKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

/** Full-access client. Bypasses RLS — only construct it AFTER the admin check passes. */
export function serviceClient(): SupabaseClient {
  const key = serviceRoleKey();
  return createClient(supabaseUrl(), key, {
    global: { fetch: keyedFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** RLS-scoped client acting as the caller, for JWT verification. */
export function callerClient(token: string): SupabaseClient {
  const key = publishableKey();
  return createClient(supabaseUrl(), key, {
    global: { fetch: keyedFetch(key), headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

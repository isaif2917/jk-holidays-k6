# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

JK Holidays: a holiday-membership site (public marketing pages, a member portal, and an admin panel). It was built with Lovable and is still connected to it. **Read `AGENTS.md` first.** It holds the binding domain rules (roles, wallet, referrals, documents), and Lovable keeps it up to date. `roadmap.md` logs each round of feature requests and what was verified.

## Lovable constraints

- Never rewrite pushed git history (no force-push, amend, rebase or squash of pushed commits). It breaks the project history on Lovable's side.
- Commits pushed to the connected branch sync into the Lovable editor, so keep the branch working.
- Some files are generated and must not be edited by hand: `src/routeTree.gen.ts`, everything in `src/integrations/supabase/` (including `types.ts`, which is regenerated from the database), and `supabase/config.toml`.
- `vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which already registers TanStack Start, React, Tailwind, tsconfig paths, nitro (Cloudflare target), and the `@` alias. Adding any of these manually breaks the app. Pass extra config through `defineConfig({ vite: {...} })`.
- `bunfig.toml` blocks package versions less than 24h old. Ask the user before adding entries to `minimumReleaseAgeExcludes`.

## Commands

```sh
npm i                 # bun.lock also exists; either installs
npm run dev           # vite dev server
npm run build         # production build (nitro → Cloudflare)
npm run lint          # eslint
npm run format        # prettier --write
npm test              # vitest run (jsdom, src/**/*.{test,spec}.{ts,tsx})
npx vitest run src/test/wallet-balance.test.ts   # single file
npx vitest run -t "name of test"                 # single test by name
```

## Architecture

- **Stack:** TanStack Start (SSR, React 19) with TanStack Router file-based routing and React Query; Tailwind v4 with shadcn/ui (`src/components/ui`); Supabase for auth, Postgres, storage and RLS.
- **Routing (`src/routes`):** see `src/routes/README.md`. Flat dot-notation files: `app.*.tsx` is the member portal (layout `app.tsx` + `PortalLayout`), `admin.*.tsx` is the admin panel (layout `admin.tsx` + `AdminLayout`), `auth.*.tsx` is login/register, and the rest are public pages (`PublicLayout`). `api/public/tour-doc.ts` is a public server route that serves tour brochures.
- **Data access is mostly client-side.** `src/lib/data.ts` exports `db` (an untyped alias of the browser Supabase client), `useMe()` (current user, profile and `isAdmin` taken from `user_roles`), and `useRows()` query helpers. Pages query tables directly, and Supabase RLS policies plus DB triggers enforce security. Browser-side checks are only for UX.
- **Privileged operations** go in `src/lib/admin.functions.ts` as `createServerFn` handlers with `requireSupabaseAuth` middleware, `assertAdmin()` (the `has_role` RPC), and then the service-role `supabaseAdmin` (dynamically imported from `client.server`). `src/start.ts` attaches the user's bearer token to every server-function call (`attachSupabaseAuth`) and wraps requests in an error-page middleware. `src/server.ts` is the custom SSR entry that turns h3-swallowed 500s into the error page.
- **Business rules live in the database,** not in app code: referral reward crediting (`credit_referral_reward` trigger, driven by `admin_settings` + `membership_plans.referral_amount`), and withdrawal ownership/amount/balance checks (trigger). Wallet balance math shared between the member and admin views is in `src/lib/wallet-balance.ts`, and input validation is in `src/lib/wallet-validation.ts`.
- **Schema/migrations are not in this repo.** `drizzle/` is an empty scaffold. The schema is managed in Lovable Cloud/Supabase, and the generated `src/integrations/supabase/types.ts` is the best reference for tables.
- **Site content fallbacks:** `src/lib/catalog.ts` reads admin-managed plans, offers and destinations, and falls back to `src/data/mock.ts` when tables are empty. Contact details and hero images come from `admin_settings`.
- **Page metadata:** content pages use `src/lib/route-meta.ts`; the home page sets its own.
- **TypeScript is intentionally non-strict** on optional/index checks so code imported from the original source compiles. Don't tighten it as a drive-by change.

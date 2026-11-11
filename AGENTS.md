<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Code imported from the JK Holidays source ZIP; roles live in public.user_roles checked via has_role() so admin access cannot be self-granted.
- tsconfig matches the source project's (non-strict optional/index checks) so imported code compiles unchanged.
- Keep referral attribution as a member-code link recorded from signup metadata; admin-only account changes must remain server-side and authenticated. Admins & Roles actions (createAdmin, createStaff, removeRole, updateRoleAccount), referral actions (settleReferral, rejectReferral, createCustomReward) and member actions (createMember, saveMemberDetails, setMemberPassword, deleteMember) run in the `admin-ops` Supabase Edge Function (supabase/functions/admin-ops), because they need SUPABASE_SERVICE_ROLE_KEY, which Lovable Cloud does not provide to servers outside Lovable (Vercel, localhost). Do not convert them back to `createServerFn`; src/lib/admin.functions.ts only holds thin client wrappers for them. Edge functions are not deployed by a git push: ask Lovable to deploy `admin-ops` after changing anything under supabase/functions.
- Member wallet reads stay scoped through the browser client and row policies; withdrawal ownership, initial status, amount rules, and available-balance checks are enforced again by a database trigger because browser checks alone are bypassable.
- Keep the shared wallet-balance calculation in `src/lib/wallet-balance.ts` so member and admin views reserve the same withdrawal statuses.
- Content pages define page-specific sharing metadata through the shared `src/lib/route-meta.ts` helper, while the home page keeps its own title and description.
- Referral rewards are governed by admin_settings keys referral_active/referral_mode/referral_value plus per-plan membership_plans.referral_amount; the credit_referral_reward trigger reads them, so never compute rewards in app code.
- Admin-uploaded member documents live in the private `documents` storage bucket listed via the site_documents table (admins manage, authenticated members read); hero carousel images are URLs stored in admin_settings key hero_images (publicly readable).
- Staff roles use extended app_role values (manager, supervisor, operations_manager, other) with a user_roles.role_label for custom titles; they grant no admin powers.

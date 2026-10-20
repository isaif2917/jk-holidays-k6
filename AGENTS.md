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
- Keep referral attribution as a member-code link recorded from signup metadata; admin-only account changes must remain in authenticated server functions.
- Member wallet reads stay scoped through the browser client and row policies; withdrawal ownership, initial status, amount rules, and available-balance checks are enforced again by a database trigger because browser checks alone are bypassable.
- Content pages define page-specific sharing metadata through the shared `src/lib/route-meta.ts` helper, while the home page keeps its own title and description.

# JK Holidays — current round

- [x] Finish admin member management: editable account email/profile, referral and wallet/withdrawal summaries, safe password reset, and protected account deletion.
- [x] Record validated referral codes at signup and show admin-managed destinations on the homepage.
- [x] Remove email confirmation from registration and verify sign-in behavior.
- [x] Replace member wallet demo values with account data and make withdrawal requests persist with server-side validation.
- [x] Explain the separate Vercel environment warning and note the pasted utils.ts error does not match the current source.
- [x] New address + email everywhere
- [x] Register / Login buttons under hero search; destination chips go to login
- [x] Premium, non-generic icons on home page (Why, How it works, stats, plans, reviews)
- [ ] Swap remaining icons on inner pages (members area, admin) to the same premium set — optional follow-up
- [x] Testimonials like reference (white cards, drop shadow) + "Add your review"
- [x] Sharper hero image, all photos converted to WebP
- [x] Membership plans: 3D overlapping swipeable pricing carousel (Framer Motion), smaller cards on mobile
- [x] Full mobile responsiveness pass

# Round: member + admin upgrades (Oct 22)

- [x] Profile: password change for the member (passwords stay scrambled, never displayed) + self-service account deletion
- [x] Holiday request flow saves real submissions; they appear in Admin → Holiday Requests with the member's details (admin notification too)
- [x] Available Holidays: live destinations, membership/nights-available card and payment summary
- [x] Wallet withdrawals already flow to Admin → Withdrawal Requests (nav renamed for clarity)
- [x] Referral rewards per plan: admin sets reward on each plan; crediting happens automatically when the referred member's payment is approved; shown in Refer & Earn, My Rewards, admin member details
- [x] Admin reports: animated line/area charts for all six report topics + CSV export
- [x] Admin settings: editable website email, phone, address and site name, live on footer/contact pages
- [x] Admin dashboard: animated new-members growth chart directly below Total Members

# Round: admin + member panel requests (Oct 23)

- [x] Removed "Delete my account" from the member profile
- [x] Member Popular Destinations shows only admin-published destinations (dashboard + Available Holidays)
- [x] Admin Holiday Requests: alternate dates picked on a calendar, alt dates highlighted red, approved requests show only the approved (alternate) dates with a blinking red "please discuss with customer support to verify the dates" note; date sorting + CSV download
- [x] Admin Settings: upload/paste/remove homepage hero images (Cloudinary), shown as an auto-rotating carousel on the homepage
- [x] Admin Documents: upload PDFs (membership details, T&C); member Documents page lists them for download and no longer shows payment receipts
- [x] Member notifications cleared for all users and now show only real notifications (mark-all-read)
- [x] Admin Support Tickets: ticket ID, user + member ID, and status select (Open / In Progress / Resolved)
- [x] Admin Members: spacious horizontally scrollable rows; referrals, wallet transactions and withdrawals editable/deletable in member details
- [x] Admin Withdrawals: pick-your-columns CSV download dialog
- [x] Admins & Roles: create staff (Manager, Supervisor, Operations Manager, Other with custom role text) and remove roles
- [x] Admin Referral Settings: program on/off, fixed vs percentage cashback, per-membership reward values; the database trigger honours these settings when crediting referrers
- [x] Verified admin screens signed in as the admin in the preview (admin creation, member password display, referral settlement)

# Round: admin passwords + referrals + staff creation fix (Oct 23)

- [x] Admin can now see the password in member details — every password set from the admin panel (add member/admin/staff or change password) is saved and shown with a Show/Hide toggle; passwords members choose themselves stay private
- [x] Fixed the "Missing Supabase environment variables" error when creating admins/staff (stale backend key re-bound); duplicate emails now get a clear message instead of overwriting an existing account's password
- [x] Referral Settings: new "Referral settlements" section — settle (credits the referrer's wallet) or reject each referral, with a settled/rejected history list
- [ ] Saif (saif2917@gmail.com) admin account created in verification — sign in at Admin Login with the password from the "Add new admin" form

# Round: admin requests (Oct 26)

- [x] Members: "Referred By" column in the member table and in View details (who referred this member)
- [x] Referral Settings: "Send Custom Reward" — search members by ID/phone/name/email/city, credit any amount to their wallet, saved in a "Custom reward history" section on the same page
- [x] Admins & Roles: Edit button beside Remove — change name, email, role, custom role label and password (own admin role is protected)
- [x] Fixed "Unauthorized: No authorization header provided": expired/lost sign-in sessions now clear the screen and return the user to the login page automatically (checked every 30s and on tab focus) instead of leaving broken admin/member pages

# Round: tour pages, chips, request details + login check (Oct 31)

- [x] Educational Tour and Corporate Tour public pages with separate header/footer links; admin Settings cards to edit homepage destination chips and upload/preview/remove the tour brochures (served publicly through a verified read-only route)
- [x] Member request view: Accepted/Rejected/Pending status, approved alternate dates with original dates struck through, proposed alternates, admin note, and the "please discuss with customer support" guidance moved out of the admin panel (verified end-to-end: member submits → admin proposes alternates → approves → member sees all of it)
- [x] Login taking twice: reproduced cause was submitting the form during the first moment after the page opens, which silently wiped it; submit buttons on Login, Register and Admin Login now wait until the page is ready, so an early click can no longer clear the form. Member login verified one-attempt end-to-end; the admin login form has the same guard.
- [ ] Swap remaining icons on inner pages (members area, admin) to the premium set — optional follow-up

# Round: request conversations + decision on altered dates (Oct 31)

- [x] Two-way messages on each holiday request: admin replies and member doubts/messages show in both panels below the request details, with date + time on every message; both sides get a reply box; each new message notifies the other side
- [x] Member accepts or declines the proposed alternate dates from the request-status view; the decision (with time) is visible to the admin, who also gets notified
- [x] Both panels show when the member requested and when the admin accepted/rejected, with date + time

# Round: altered-date decision after approval (Oct 31)

- [x] Member keeps the Accept new dates / Keep original dates buttons in Request Status → view even after the admin approves the request with changed dates; once decided, the decision (with date + time) replaces the buttons and the customer-support alert disappears
- [x] Admin can change dates on an approved request (Change Dates button); sending new dates clears any earlier member decision so the member is asked again
- [x] Admin panel shows the member's accepted/declined status with timestamp; verified end-to-end (admin proposes → approves → member accepts → admin sees decision); test request cleaned up

# Round: membership gate + payment details + settings error (Oct 31)

- [x] Members without an active membership (status Inactive / no plan) see a red "Membership required" alert on Request Holiday; the request wizard is blocked and submission shows a red alert toast, with a Take a Membership Plan button
- [x] Membership request dialog (My Membership → Request/Upgrade) now shows UPI QR + UPI ID (UPI) and account name/number/IFSC/bank with copy buttons (Bank Transfer); Card/Cash shows a "team will contact you" note
- [x] Admin Settings RLS error could not be reproduced: verified as a signed-in admin (admin@jkholidays.com) that adding/removing destination chips works; the live-site error looks like a stale session/login on jkholidays.org — re-login advised
- [x] Verified end-to-end: inactive member blocked with red alert, active member sees the wizard (temporarily activated/deactivated test member), test destination chip cleaned up

# Round: admin-managed featured packages + destination marquee (Oct 31)

- [x] Admin → Settings → "Holiday Packages (Homepage Featured)": add, edit (name, location, tag, duration, rating, reviews, photo URLs, highlights) and remove packages; homepage Featured Holiday Packages shows managed packages and falls back to bundled defaults
- [x] Public read policy on admin_settings extended to the featured_packages key (migration 0011)
- [x] Homepage Popular Destinations rebuilt as an oversized horizontal marquee moving left to right in super slow motion (90s loop, pauses on hover)
- [x] Verified: package add/edit/remove round-trip from the admin UI, homepage shows managed package, marquee transform moves; test package removed

# Demo / test credentials

Dev and QA only — none of this is real user data.

**All accounts below sign in through the one "Sign In" form** (the "Welcome Back"
page) — there is no longer a separate admin/vendor/dealer login page. `POST
/api/auth/login` tries the member, employee, vendor, and dealer tables in turn and
routes you to the right dashboard based on which one matched.

## Member accounts (email/password login)

| Button / label | Email | Password | Tier | Notes |
|---|---|---|---|---|
| User Demo | `demo@vivahaaelite.demo` | `Demo@123` | Standard (Gold) | Ordinary member account. No gender set — GET /api/profiles correctly returns an empty list with a "set your gender" message rather than guessing. |
| "Admin Demo" | `admin@vivahaaelite.demo` | `Admin@123` | Elite (Platinum Plus) | **Not a real admin** — the `User` model has no admin role. Despite the button's label, this is just a second regular member account, given Elite tier so the Elite dashboard theme is easy to check. |

Seeded directly via Prisma (not through the registration wizard), so their profile
fields are mostly empty — useful for checking auth/theme, not for a populated
profile view.

### Panel 3 tier/gender demo logins (real, populated profiles)

All password `Member@123`. These double as regular engagement demo data — arjun and
divya are already a mutual Match (chat works out of the box); ravi liked shalini but
she hadn't liked back until you do it live (one-directional Like → no chat yet, a
real "liked but not matched" state to check).

| Email | Gender | Tier (plan) | Notes |
|---|---|---|---|
| `arjun@vivahaaelite.demo` | Male | Standard (GOLD) | Dealer-onboarded (CBEDEAL); mutual Match with Divya |
| `divya@vivahaaelite.demo` | Female | Standard (GOLD) | Dealer-onboarded (CBEDEAL); mutual Match with Arjun |
| `ravi@vivahaaelite.demo` | Male | Elite (PLATINUM) | Liked Shalini (not yet mutual) |
| `shalini@vivahaaelite.demo` | Female | Elite (PLATINUM) | Received Ravi's like; Elite-only "who viewed me" works for this account |

Each of the 4 has nakshatra/rashi/income/lifestyle/family-background fields filled
in, so Elite's advanced filters and the AI best-match section have real data to
score — not empty profiles. Verified live: each account's browse results contain
only the opposite gender (checked via the raw `GET /api/profiles` response, not just
the UI), Standard vs Elite visual theme and filter set differ for real, and the
monthly profile-edit cap (5/month) blocks a 6th save with a clear message.

## Admin panel — Employee accounts (real, RBAC-enforced)

Sign in with any of these through the same main form — the response tells the app
it's an employee login and it lands you on the Admin Portal instead of the member
dashboard. Backed by its own `Employee` model and JWT session, separate from the
member `User` auth above. Seeded by `npm run db:seed` (via `prisma/seedAdminDemo.js`),
one account per role:

| Role | Email | Password |
|---|---|---|
| HR / Full Admin | `hr@vivahaaelite.demo` | `HrAdmin@123` |
| User Management | `usermgr@vivahaaelite.demo` | `UserMgr@123` |
| Vendor Management | `vendormgr@vivahaaelite.demo` | `VendorMgr@123` |
| Dealer Management | `dealermgr@vivahaaelite.demo` | `DealerMgr@123` |

Each role only sees its permitted sidebar sections, and every `/api/admin/*` call is
independently role-checked server-side (see `server/lib/rbac.js`) regardless of what
the UI shows — logging in as a non-HR role and confirming both the hidden nav items
and the 403s on direct API calls is the way to check this hasn't regressed.

The demo dataset also seeds 2 dealers, 5 vendors (across categories, with generated
`V0##XX`-style IDs), 6 members (some dealer-registered), payments, bookings,
ratings, and enquiries — see `prisma/seedAdminDemo.js` for the full list.

## Vendor partner portal (real, own-data-only)

Same main sign-in form again, backed by the same `Vendor` rows the admin Vendor
Management section manages. A vendor can only ever see its own bookings, and
(Panel 2) its dashboard is split into Profile & Category Info / Bookings / Earnings /
Ratings & Feedback / Statistics sections, with category-specific booking fields
(`server/lib/vendorCategoryFields.js`) that differ per one of 6 "dashboard families":

- `vendor@vivahaaelite.demo` / `Vendor@123` (Photography, `V001PH`) — 1 completed
  booking, ₹18,000 earnings, 1 rating
- `venue1@vivahaaelite.demo` / `Vendor@123` (Venue, `V002VN`) — 1 completed booking,
  ₹45,000 earnings, 1 rating
- `catering1@vivahaaelite.demo` / `Vendor@123` (Catering, `V003CS`) — **richest demo
  account**: 1 completed (₹62,000, rated 5★), 1 ongoing (with headcount/menu detail
  fields filled in), 1 rejected ("Fully booked on that date"), 1 Under Valuation
  enquiry awaiting Accept/Decline
- `makeup1@vivahaaelite.demo` / `Vendor@123` (Makeup, `V004MU`) — has a rejected booking
- `decor1@vivahaaelite.demo` / `Vendor@123` (Decor, `V005DC`) — has a rejected booking
  + an open complaint (Decorations & Flowers family, shared with Florist)
- `rbacflorist@vivahaaelite.demo` / `Vendor@123` (Florist, `V006FL`) — Decorations &
  Flowers family
- `dj1@vivahaaelite.demo` / `Vendor@123` (DJ, `V007DJ`) — category fields only, no
  booking history yet
- `iyer1@vivahaaelite.demo` / `Vendor@123` (Iyer/Purohit, `V008PR`) — Iyer &
  Nadaswaram family (shared with Nadhaswaram-Vaathiyam), category fields only

"Under Valuation" = an `Enquiry` at `status=OPEN` for that vendor — the vendor
Accepts (→ `CONVERTED`) or Declines (→ `CLOSED`) it from the Bookings tab.
"Rejected" = `Booking.status=CANCELLED`, shown with who cancelled and why.

## Dealer portal (real, own-onboarded-users-only)

Same main sign-in form again, backed by the `Dealer` model (Panel 1). A dealer can
only ever see members carrying their own `dealerId` (i.e. onboarded with their promo
code — `Dealer.dealerCode` doubles as the promo code, there's no separate field), and
can only suggest matches for those members against candidates on the *same
membership tier* (`User.plan`) — enforced server-side in `POST
/api/dealer/users/:userId/send-match`, not just hidden in the UI:

- `dealer1@vivahaaelite.demo` / `Dealer@123` (Coimbatore Alliance Partners, promo
  code `CBEDEAL`) — onboarded members: Arjun Kumar & Divya Rajan (both GOLD tier)

`dealer2@vivahaaelite.demo` (Salem Matrimony Associates, `SLMDEAL`) has no password
set, demonstrating a dealer with self-service login not yet enabled by an admin — the
unified login correctly falls through to "Invalid email or password" for it, same as
any other unmatched login attempt.

Dealer dashboard tools:
- **Onboarded members** — list tagged with the dealer's promo code.
- **Suggest Match** — same-tier-only candidates via the existing `suggestMatches`
  scorer (extended with a `sameTierOnly` filter), sent through the same
  Notification mechanism the admin panel's User Management curated-match action uses.
- **Reminders** — onboarded members who are unpaid and/or inactive 5+/7+ days, each
  with its own differentiated message (not a generic "come back" blast), sent via
  Notification + best-effort email (`server/lib/mailer.js`, logs to console when SMTP
  isn't configured, as in local dev).

## Running locally

```
npm run db:seed       # bootstraps member, employee, and vendor demo data
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173, proxies /api to the backend
```

Sign in at `http://localhost:5173` via the "Sign In" nav link — the same form for
every account type above.

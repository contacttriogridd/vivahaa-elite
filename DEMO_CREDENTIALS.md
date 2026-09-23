# Demo / test credentials

Dev and QA only — none of this is real user data.

**All accounts below sign in through the one "Sign In" form** (the "Welcome Back"
page) — there is no longer a separate admin/vendor/dealer login page. `POST
/api/auth/login` tries the member, employee, and vendor tables in turn and routes
you to the right dashboard based on which one matched. Dealers don't have a
self-service login at all (see "Dealers — no login" below).

## Member accounts (email/password login)

| Button / label | Email | Password | Tier | Notes |
|---|---|---|---|---|
| User Demo | `demo@vivahaaelite.demo` | `Demo@123` | Standard (Gold) | Ordinary member account |
| "Admin Demo" | `admin@vivahaaelite.demo` | `Admin@123` | Elite (Platinum Plus) | **Not a real admin** — the `User` model has no admin role. Despite the button's label, this is just a second regular member account, given Elite tier so the Elite dashboard theme is easy to check. |

Seeded directly via Prisma (not through the registration wizard), so their profile
fields are mostly empty — useful for checking auth/theme, not for a populated
profile view.

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
Management section manages. A vendor can only ever see its own
bookings/ratings/cancellations:

- `vendor@vivahaaelite.demo` / `Vendor@123` (Photography, `V001PH`)
- `venue1@vivahaaelite.demo` / `Vendor@123` (Venue, `V002VN`)
- `catering1@vivahaaelite.demo` / `Vendor@123` (Catering, `V003CS`)
- `makeup1@vivahaaelite.demo` / `Vendor@123` (Makeup, `V004MU` — has a cancelled booking)
- `decor1@vivahaaelite.demo` / `Vendor@123` (Decor, `V005DC` — has a cancelled booking + an open complaint)

## Dealers — no login

Dealers do not get a self-service login (the old client-side mock `Dealer.jsx` /
`DealerLogin` was removed when login was unified into the one form). Dealer-related
work happens entirely on the admin side: the Dealer Management employee role
(`dealermgr@vivahaaelite.demo` above) manages dealer records and resolves the
edit-request log dealers submit by email/ticket.

## Running locally

```
npm run db:seed       # bootstraps member, employee, and vendor demo data
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173, proxies /api to the backend
```

Sign in at `http://localhost:5173` via the "Sign In" nav link — the same form for
every account type above.

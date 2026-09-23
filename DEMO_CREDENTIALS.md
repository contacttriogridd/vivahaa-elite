# Demo / test credentials

Dev and QA only — none of this is real user data. The two email/password pairs below
are already hardcoded in `src/pages/PremiumLogin.tsx`'s "Admin Demo" / "User Demo"
buttons (dev-only, gated behind `import.meta.env.DEV`), so this file doesn't expose
anything that wasn't already visible in the committed source — it just makes it easy
to find without reading the component.

## Real database accounts (email/password login)

| Button / label | Email | Password | Tier | Notes |
|---|---|---|---|---|
| User Demo | `demo@vivahaaelite.demo` | `Demo@123` | Standard (Gold) | Ordinary member account |
| "Admin Demo" | `admin@vivahaaelite.demo` | `Admin@123` | Elite (Platinum Plus) | **Not a real admin** — the `User` model has no admin role. Despite the button's label, this is just a second regular member account, given Elite tier so the Elite dashboard theme is easy to check. |

Seeded directly via Prisma (not through the registration wizard), so their profile
fields are mostly empty — useful for checking auth/theme, not for a populated
profile view.

## Admin panel — Employee accounts (real, RBAC-enforced)

The admin panel (`/admin` after signing in at the footer's "Admin sign-in" link) is
backed by its own `Employee` model and JWT session — separate from the member
`User` auth above. Seeded by `npm run db:seed` (via `prisma/seedAdminDemo.js`), one
account per role:

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

Separate login again (footer's "Vendor sign-in" link), backed by the same `Vendor`
rows the admin Vendor Management section manages. A vendor can only ever see its own
bookings/ratings/cancellations:

- `vendor@vivahaaelite.demo` / `Vendor@123` (Photography, `V001PH`)
- `venue1@vivahaaelite.demo` / `Vendor@123` (Venue, `V002VN`)
- `catering1@vivahaaelite.demo` / `Vendor@123` (Catering, `V003CS`)
- `makeup1@vivahaaelite.demo` / `Vendor@123` (Makeup, `V004MU` — has a cancelled booking)
- `decor1@vivahaaelite.demo` / `Vendor@123` (Decor, `V005DC` — has a cancelled booking + an open complaint)

## Mock shortcuts (no database involved, legacy)

Unrelated to everything above — pure client-side mock logic in the legacy `.jsx`
stack (`Dealer.jsx`, `Login.jsx`'s `DealerLogin`), left as-is since dealers don't get
a self-service login in the real system (see the Dealer Management role's edit-request
log instead):

- **Dealer panel** — email `dealer@demo.com`, no password.

## Running locally

```
npm run db:seed       # bootstraps member, employee, vendor, dealer demo data
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173, proxies /api to the backend
```

Sign in at `http://localhost:5173` via the "Sign In" nav link (the real,
database-backed login), not the legacy mock login page.

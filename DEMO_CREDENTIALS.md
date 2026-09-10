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

## Mock shortcuts (no database involved)

These are unrelated to the two accounts above — pure client-side mock logic in the
legacy `.jsx` stack, always available regardless of what's in the database:

- **Dealer panel** — email `dealer@demo.com`, no password.
- **Admin panel** — password `admin123`, or leave it blank.

## Running locally

```
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173, proxies /api to the backend
```

Sign in at `http://localhost:5173` via the "Sign In" nav link (the real,
database-backed login), not the legacy mock login page.

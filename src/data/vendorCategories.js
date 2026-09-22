// Single source of truth for the platform's vendor service categories. Split out
// of src/data.js so server/lib/vendorId.js (backend, runtime-imported) doesn't have
// to import src/data.js as a whole — that file also pulls in src/lib/plans.ts,
// a TypeScript source with no build step of its own. Vite/Node 24's native
// type-stripping resolve that fine for the frontend and local dev respectively,
// but Vercel's serverless function bundler doesn't: it traces and packages plain
// .js dependencies reliably, but a runtime `import` of a raw .ts file isn't
// guaranteed to resolve in that environment — confirmed live in production
// (ERR_MODULE_NOT_FOUND for plans.ts, crashing every /api/* route). Keeping the
// vendor category list here means the backend's dependency graph never has to
// cross into TypeScript source at all.
export const VENDOR_CATS = ['Invitation', 'Venue', 'Catering', 'Photography', 'Decor', 'Makeup', 'Honeymoon',
  'Iyer/Purohit', 'Nadhaswaram-Vaathiyam', 'Hotel', 'Travel', 'Wedding Planner', 'DJ', 'Car Rental', 'Florist']
export const SHARED_CATS = ['Iyer/Purohit', 'Nadhaswaram-Vaathiyam']

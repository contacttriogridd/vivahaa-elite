// Vercel serverless entrypoint. The project was deployed with no backend at all —
// framework: "vite" builds only the static frontend, so every request to /api/*
// fell through to Vercel's own platform 404 (confirmed live: raw "NOT_FOUND" body,
// never reaching Express). vercel.json rewrites every /api/* request to this one
// function explicitly — a bracket-named catch-all filename (api/[...path].js) was
// tried first, but empirically only matched exactly one path segment
// (/api/health reached it, /api/vendor/login didn't), which isn't documented
// Vercel behavior and wasn't worth chasing further; an explicit rewrite is
// unambiguous. Vercel's Node runtime accepts an Express app exported as the
// default handler directly — Express apps are already callable as
// `(req, res) => void`, so no adapter package is needed. server/index.js's own
// internal routes (app.use('/api/admin', ...) etc.) still do the real routing;
// this file only gets the request to Express in the first place.
import app from '../server/index.js'

export default app

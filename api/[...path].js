// Vercel serverless entrypoint. The project was deployed with no backend at all —
// framework: "vite" builds only the static frontend, so every request to /api/*
// fell through to Vercel's own platform 404 (confirmed live: raw "NOT_FOUND" body,
// never reaching Express). This file's catch-all filename ([...path]) matches any
// path under /api/, and Vercel's Node runtime accepts an Express app exported as
// the default handler directly — Express apps are already callable as
// `(req, res) => void`, so no adapter package is needed. server/index.js's own
// internal routes (app.use('/api/admin', ...) etc.) still do the real routing;
// this file only gets the request to Express in the first place.
import app from '../server/index.js'

export default app

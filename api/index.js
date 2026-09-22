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
//
// server/index.js is imported dynamically (not as a static top-level import) and
// wrapped in try/catch: a static import that throws during module evaluation
// crashes with Vercel's own opaque FUNCTION_INVOCATION_FAILED page and gives no
// way to see *why* — the runtime logs API isn't reachable from this environment
// (403), so this is the only way to actually observe a module-load failure here.
let appPromise
async function getApp() {
  if (!appPromise) appPromise = import('../server/index.js').then((m) => m.default)
  return appPromise
}

export default async function handler(req, res) {
  try {
    const app = await getApp()
    return app(req, res)
  } catch (err) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      diagnostic: 'server/index.js failed to load',
      message: err?.message,
      stack: err?.stack,
    }))
  }
}

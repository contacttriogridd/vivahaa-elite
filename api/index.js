// Vercel serverless entrypoint. vercel.json rewrites every /api/* request to this
// one function — Vercel's Node runtime accepts an Express app exported as the
// default handler directly, since Express apps are already callable as
// (req, res) => void. server/index.js's own internal route prefixes
// (app.use('/api/admin', ...) etc.) still do the real routing; this file only
// gets the request to Express in the first place.
import app from '../server/index.js'

export default app

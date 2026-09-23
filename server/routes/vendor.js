// Vendor self-service portal API (Task 6). Every route below is scoped to
// req.vendor.id (set by authenticateVendor) — a vendor can only ever query its own
// bookings/ratings, never another vendor's or any admin/user/dealer data.
import express from 'express'
import bcrypt from 'bcryptjs'
import { signVendorToken, authenticateVendor } from '../lib/rbac.js'

const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  maxAge: 8 * 3600000,
})

const serializeVendor = ({ password, ...rest }) => rest

export function createVendorRouter(prisma) {
  const router = express.Router()
  const requireVendor = authenticateVendor(prisma)

  // POST /api/vendor/login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body
      if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

      const vendor = await prisma.vendor.findUnique({ where: { email } })
      if (!vendor) return res.status(401).json({ message: 'Invalid email or password' })

      const valid = await bcrypt.compare(password, vendor.password)
      if (!valid) return res.status(401).json({ message: 'Invalid email or password' })
      if (vendor.status !== 'active') return res.status(403).json({ message: 'Account is not active' })

      const accessToken = signVendorToken(vendor)
      res.cookie('vendorAccessToken', accessToken, cookieOpts())
      res.json({ accessToken, vendor: serializeVendor(vendor) })
    } catch {
      res.status(500).json({ message: 'Server error' })
    }
  })

  router.post('/logout', (req, res) => {
    res.clearCookie('vendorAccessToken')
    res.json({ message: 'Logged out' })
  })

  // GET /api/vendor/me
  router.get('/me', requireVendor, (req, res) => {
    res.json({ vendor: serializeVendor(req.vendor) })
  })

  // GET /api/vendor/bookings — own bookings, upcoming and completed, newest first.
  router.get('/bookings', requireVendor, async (req, res) => {
    const bookings = await prisma.booking.findMany({
      where: { vendorId: req.vendor.id },
      include: { user: { select: { id: true, name: true, city: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ bookings })
  })

  // GET /api/vendor/ratings — own ratings/reviews + the running average.
  router.get('/ratings', requireVendor, async (req, res) => {
    const ratings = await prisma.vendorRating.findMany({
      where: { vendorId: req.vendor.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const average = ratings.length ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0
    res.json({ ratings, average, count: ratings.length })
  })

  // GET /api/vendor/bookings/cancelled — own cancelled bookings, labeled by who cancelled.
  router.get('/bookings/cancelled', requireVendor, async (req, res) => {
    const bookings = await prisma.booking.findMany({
      where: { vendorId: req.vendor.id, status: 'CANCELLED' },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    res.json({ bookings })
  })

  return router
}

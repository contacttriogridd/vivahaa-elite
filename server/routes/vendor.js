// Vendor self-service portal API (Task 6). Every route below is scoped to
// req.vendor.id (set by authenticateVendor) — a vendor can only ever query its own
// bookings/ratings, never another vendor's or any admin/user/dealer data.
import express from 'express'
import bcrypt from 'bcryptjs'
import { signVendorToken, authenticateVendor } from '../lib/rbac.js'
import { familyForCategory, sanitizeDetails } from '../lib/vendorCategoryFields.js'

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

  // GET /api/vendor/orders — the 4-bucket order status dashboard (Task 2.1):
  // Completed/Ongoing/Rejected map onto the existing Booking.status enum; "Under
  // Valuation" (enquiry received, pending this vendor's decision) maps onto the
  // existing Enquiry model at status=OPEN — an enquiry hasn't become a Booking yet,
  // so it deliberately isn't read off Booking at all.
  router.get('/orders', requireVendor, async (req, res) => {
    const [completed, ongoing, rejected, underValuation] = await Promise.all([
      prisma.booking.findMany({
        where: { vendorId: req.vendor.id, status: 'COMPLETED' },
        include: { user: { select: { id: true, name: true, city: true } } },
        orderBy: { scheduledDate: 'desc' },
      }),
      prisma.booking.findMany({
        where: { vendorId: req.vendor.id, status: { in: ['PENDING', 'CONFIRMED'] } },
        include: { user: { select: { id: true, name: true, city: true } } },
        orderBy: { scheduledDate: 'asc' },
      }),
      prisma.booking.findMany({
        where: { vendorId: req.vendor.id, status: 'CANCELLED' },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.enquiry.findMany({
        where: { vendorId: req.vendor.id, status: 'OPEN' },
        include: { user: { select: { id: true, name: true, city: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])
    res.json({
      completed, ongoing, rejected, underValuation,
      counts: { completed: completed.length, ongoing: ongoing.length, rejected: rejected.length, underValuation: underValuation.length },
    })
  })

  // PATCH /api/vendor/enquiries/:id — the vendor's decision on an "Under Valuation"
  // enquiry: accept keeps it moving toward a booking (CONVERTED — matches the status
  // the admin Enquiries Funnel already reports on), decline closes it out (CLOSED).
  router.patch('/enquiries/:id', requireVendor, async (req, res) => {
    const { decision } = req.body
    if (!['accept', 'decline'].includes(decision)) return res.status(400).json({ message: 'decision must be accept or decline' })

    const enquiry = await prisma.enquiry.findUnique({ where: { id: req.params.id } })
    if (!enquiry || enquiry.vendorId !== req.vendor.id) return res.status(404).json({ message: 'Enquiry not found' })
    if (enquiry.status !== 'OPEN') return res.status(409).json({ message: 'This enquiry has already been resolved' })

    const updated = await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: { status: decision === 'accept' ? 'CONVERTED' : 'CLOSED' },
    })
    res.json({ enquiry: updated })
  })

  // GET /api/vendor/earnings — total confirmed earnings (Task 2.2), plus the
  // rejected-services list with who rejected and why. Reuses the exact
  // sum-successful-payments pattern the admin Dealer Management screen already uses
  // for dealer earnings (Payment.aggregate, status=SUCCESS).
  router.get('/earnings', requireVendor, async (req, res) => {
    const agg = await prisma.payment.aggregate({
      where: { vendorId: req.vendor.id, type: 'VENDOR_BOOKING', status: 'SUCCESS' },
      _sum: { amount: true }, _count: true,
    })
    const rejected = await prisma.booking.findMany({
      where: { vendorId: req.vendor.id, status: 'CANCELLED' },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    res.json({
      totalEarnings: agg._sum.amount || 0,
      paidBookingsCount: agg._count,
      rejected: rejected.map((b) => ({
        id: b.id, serviceType: b.serviceType, user: b.user,
        rejectedBy: b.cancelledBy, reason: b.cancelReason, date: b.updatedAt,
      })),
    })
  })

  // GET /api/vendor/category — this vendor's category family (Task 2.3): label +
  // the field schema for its category-specific details, so the frontend doesn't
  // hardcode which fields belong to which category.
  router.get('/category', requireVendor, (req, res) => {
    const family = familyForCategory(req.vendor.category)
    res.json({ category: req.vendor.category, family })
  })

  // PATCH /api/vendor/bookings/:id/details — vendor fills in category-specific
  // fields for one of their own bookings (e.g. headcount/menu for Catering). Payload
  // is filtered to only the keys that category's family actually defines — a
  // Catering vendor can't stash arbitrary JSON through this endpoint.
  router.patch('/bookings/:id/details', requireVendor, async (req, res) => {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } })
    if (!booking || booking.vendorId !== req.vendor.id) return res.status(404).json({ message: 'Booking not found' })

    const details = sanitizeDetails(req.vendor.category, req.body.details)
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { details: { ...(booking.details || {}), ...details } },
    })
    res.json({ booking: updated })
  })

  // GET /api/vendor/stats — bookings received vs completed, grouped by month
  // (Task 2.3's statistics section). Computed in JS rather than a raw SQL
  // date_trunc query — vendor booking volume is small enough that this is simpler
  // and stays portable if the DB ever changes.
  router.get('/stats', requireVendor, async (req, res) => {
    const bookings = await prisma.booking.findMany({
      where: { vendorId: req.vendor.id },
      select: { createdAt: true, status: true },
    })
    const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const buckets = {}
    for (const b of bookings) {
      const key = monthKey(new Date(b.createdAt))
      if (!buckets[key]) buckets[key] = { month: key, received: 0, completed: 0 }
      buckets[key].received += 1
      if (b.status === 'COMPLETED') buckets[key].completed += 1
    }
    const series = Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month))
    res.json({ series })
  })

  return router
}

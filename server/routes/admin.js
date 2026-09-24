// Admin-panel API: employee auth + employee management (HR_ADMIN only). Payments,
// Engagement, Post-Match, Enquiries, Dealer and Vendor management endpoints land
// here in later phases, each gated the same way — authenticateEmployee first, then
// requireRole(...) for the specific section.
import express from 'express'
import bcrypt from 'bcryptjs'
import { seedCore } from '../../prisma/seed.js'
import {
  EMPLOYEE_ROLES, signEmployeeToken, authenticateEmployee, requireRole, logEmployeeAction,
} from '../lib/rbac.js'
import { createEmployeeWithId } from '../lib/employeeId.js'
import { createVendorWithId } from '../lib/vendorId.js'
import { suggestMatches } from '../lib/matchSuggestion.js'

const dateRangeWhere = (from, to) =>
  (from || to) ? { createdAt: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}

const pagination = (query) => {
  const take = Math.min(parseInt(query.pageSize) || 25, 100)
  const page = Math.max(parseInt(query.page) || 1, 1)
  return { take, skip: (page - 1) * take, page }
}

const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  maxAge: 8 * 3600000,
})

const serializeEmployee = ({ password, ...rest }) => rest
const serializeVendor = ({ password, ...rest }) => rest

export function createAdminRouter(prisma) {
  const router = express.Router()
  const requireEmployee = authenticateEmployee(prisma)

  // POST /api/admin/login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body
      if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

      const employee = await prisma.employee.findUnique({ where: { email } })
      if (!employee || !employee.active) return res.status(401).json({ message: 'Invalid email or password' })

      const valid = await bcrypt.compare(password, employee.password)
      if (!valid) return res.status(401).json({ message: 'Invalid email or password' })

      const accessToken = signEmployeeToken(employee)
      res.cookie('employeeAccessToken', accessToken, cookieOpts())
      res.json({ accessToken, employee: serializeEmployee(employee) })
    } catch {
      res.status(500).json({ message: 'Server error' })
    }
  })

  // POST /api/admin/logout
  router.post('/logout', (req, res) => {
    res.clearCookie('employeeAccessToken')
    res.json({ message: 'Logged out' })
  })

  // POST /api/admin/_seed-production — TEMPORARY, remove after use. Runs the same
  // idempotent seedCore() that `npm run db:seed` runs locally, against whichever
  // DATABASE_URL this deployment has — there's no other way to reach production's
  // DB from outside since Vercel's Postgres integration only exposes it to the
  // running deployment, never decryptable via the management API. Gated on
  // SEED_TRIGGER_SECRET (set directly in Vercel, never committed) rather than
  // requireEmployee, since the whole point is to seed the very data an employee
  // login would need to exist first. 404s (not 401) when the secret is unset or
  // wrong, so the route's existence isn't observable from outside.
  router.post('/_seed-production', async (req, res) => {
    if (!process.env.SEED_TRIGGER_SECRET || req.headers['x-seed-secret'] !== process.env.SEED_TRIGGER_SECRET) {
      return res.status(404).end()
    }
    try {
      await seedCore(prisma)
      res.json({ message: 'Seeded' })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })

  // GET /api/admin/me — used by the admin SPA to know which sections/actions to show.
  router.get('/me', requireEmployee, (req, res) => {
    res.json({ employee: serializeEmployee(req.employee) })
  })

  // ── Employee management (HR_ADMIN only) ─────────────────────────────────────

  router.get('/employees', requireEmployee, requireRole(), async (req, res) => {
    const employees = await prisma.employee.findMany({ orderBy: { sequenceNo: 'asc' } })
    res.json({ employees: employees.map(serializeEmployee) })
  })

  router.post('/employees', requireEmployee, requireRole(), async (req, res) => {
    try {
      const { name, email, password, role } = req.body
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Name, email, password and role are required' })
      }
      if (!EMPLOYEE_ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' })

      const exists = await prisma.employee.findUnique({ where: { email } })
      if (exists) return res.status(409).json({ message: 'Email already in use' })

      const hashed = await bcrypt.hash(password, 12)
      const employee = await createEmployeeWithId(prisma, { name, email, password: hashed, role })
      await logEmployeeAction(prisma, req.employee, {
        action: 'create_employee', entity: 'Employee', entityId: employee.id, ip: req.ip,
      })
      res.status(201).json({ employee: serializeEmployee(employee) })
    } catch {
      res.status(500).json({ message: 'Server error' })
    }
  })

  router.patch('/employees/:id', requireEmployee, requireRole(), async (req, res) => {
    try {
      const { name, role, active } = req.body
      if (role && !EMPLOYEE_ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' })

      const employee = await prisma.employee.update({
        where: { id: req.params.id },
        data: { ...(name !== undefined && { name }), ...(role !== undefined && { role }), ...(active !== undefined && { active }) },
      })
      await logEmployeeAction(prisma, req.employee, {
        action: 'update_employee', entity: 'Employee', entityId: employee.id, ip: req.ip,
        details: JSON.stringify({ name, role, active }),
      })
      res.json({ employee: serializeEmployee(employee) })
    } catch {
      res.status(404).json({ message: 'Employee not found' })
    }
  })

  // ── Payments (HR_ADMIN only — site-wide financial data) ─────────────────────

  router.get('/payments', requireEmployee, requireRole(), async (req, res) => {
    const { status, tier, from, to, sort = 'createdAt', dir = 'desc' } = req.query
    const { take, skip, page } = pagination(req.query)
    const where = {
      ...(status && { status }),
      ...(tier && { tierAtPayment: tier }),
      ...dateRangeWhere(from, to),
    }
    const sortableFields = ['createdAt', 'amount', 'status']
    const orderBy = { [sortableFields.includes(sort) ? sort : 'createdAt']: dir === 'asc' ? 'asc' : 'desc' }
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where, orderBy, take, skip,
        include: {
          user: { select: { id: true, name: true, email: true } },
          vendor: { select: { id: true, name: true, vendorId: true } },
          dealer: { select: { id: true, name: true, dealerCode: true } },
        },
      }),
      prisma.payment.count({ where }),
    ])
    res.json({ payments, total, page, pageSize: take })
  })

  // ── User Engagement (HR_ADMIN, USER_MANAGEMENT) ─────────────────────────────

  router.get('/engagement', requireEmployee, requireRole('USER_MANAGEMENT'), async (req, res) => {
    const { search, tier } = req.query
    const { take, skip, page } = pagination(req.query)
    const where = {
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(tier && { plan: tier }),
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, orderBy: { createdAt: 'desc' }, take, skip,
        select: {
          id: true, name: true, email: true, city: true, plan: true, gender: true,
          _count: { select: { profileViewsMade: true, likesSent: true } },
        },
      }),
      prisma.user.count({ where }),
    ])
    res.json({ users, total, page, pageSize: take })
  })

  router.get('/engagement/:userId/suggestions', requireEmployee, requireRole('USER_MANAGEMENT'), async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ suggestions: await suggestMatches(prisma, user) })
  })

  // Logs a curated-match send or an Elite priority-support touch as a Notification
  // to the member plus an attributable AuditLog entry — see Task 7's User
  // Management role and its audit-trail requirement.
  router.post('/engagement/:userId/actions', requireEmployee, requireRole('USER_MANAGEMENT'), async (req, res) => {
    const { type, targetUserId, note } = req.body
    if (!['match_suggestion', 'priority_support'].includes(type)) {
      return res.status(400).json({ message: 'type must be match_suggestion or priority_support' })
    }
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (type === 'match_suggestion' && !targetUserId) {
      return res.status(400).json({ message: 'targetUserId is required for match_suggestion' })
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: type === 'match_suggestion' ? 'A curated match for you' : 'Priority support',
        message: note || (type === 'match_suggestion'
          ? "Our team found a profile we think you'll like — check your matches."
          : 'Your Elite priority support request has been logged — our team will reach out shortly.'),
        type,
      },
    })
    await logEmployeeAction(prisma, req.employee, {
      action: `engagement_${type}`, entity: 'User', entityId: user.id, ip: req.ip,
      details: JSON.stringify({ targetUserId, note }),
    })
    res.status(201).json({ message: 'Logged' })
  })

  // ── Post-Match Services (HR_ADMIN, USER_MANAGEMENT) ──────────────────────────

  router.get('/post-match', requireEmployee, requireRole('USER_MANAGEMENT'), async (req, res) => {
    const { take, skip, page } = pagination(req.query)
    const matches = await prisma.match.findMany({ select: { userAId: true, userBId: true } })
    const matchedUserIds = [...new Set(matches.flatMap((m) => [m.userAId, m.userBId]))]

    const users = await prisma.user.findMany({
      where: { id: { in: matchedUserIds } }, orderBy: { name: 'asc' }, take, skip,
      select: {
        id: true, name: true, city: true,
        bookings: {
          select: { id: true, serviceType: true, status: true, vendor: { select: { name: true, vendorId: true, category: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    res.json({ users, total: matchedUserIds.length, page, pageSize: take })
  })

  // ── Enquiries Funnel (HR_ADMIN only) ─────────────────────────────────────────

  router.get('/enquiries/funnel', requireEmployee, requireRole(), async (req, res) => {
    const { from, to } = req.query
    const where = dateRangeWhere(from, to)
    const [total, converted] = await Promise.all([
      prisma.enquiry.count({ where }),
      prisma.enquiry.count({ where: { ...where, status: 'CONVERTED' } }),
    ])
    res.json({ total, converted, conversionRate: total ? Math.round((converted / total) * 1000) / 10 : 0 })
  })

  router.get('/enquiries', requireEmployee, requireRole(), async (req, res) => {
    const { status, from, to } = req.query
    const { take, skip, page } = pagination(req.query)
    const where = { ...(status && { status }), ...dateRangeWhere(from, to) }
    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where, orderBy: { createdAt: 'desc' }, take, skip,
        include: { user: { select: { id: true, name: true } }, vendor: { select: { id: true, name: true, vendorId: true } } },
      }),
      prisma.enquiry.count({ where }),
    ])
    res.json({ enquiries, total, page, pageSize: take })
  })

  // ── Dealer Management (HR_ADMIN, DEALER_MANAGEMENT) ──────────────────────────

  router.get('/dealers', requireEmployee, requireRole('DEALER_MANAGEMENT'), async (req, res) => {
    const dealers = await prisma.dealer.findMany({
      orderBy: { sequenceNo: 'asc' },
      include: { _count: { select: { users: true, payments: true } } },
    })
    const withEarnings = await Promise.all(dealers.map(async (d) => {
      const agg = await prisma.payment.aggregate({ where: { dealerId: d.id, status: 'SUCCESS' }, _sum: { amount: true } })
      return { ...d, totalEarned: agg._sum.amount || 0 }
    }))
    res.json({ dealers: withEarnings })
  })

  router.post('/dealers', requireEmployee, requireRole('DEALER_MANAGEMENT'), async (req, res) => {
    try {
      const { name, email, phone, city, dealerCode, commissionPct } = req.body
      if (!name || !email || !dealerCode) return res.status(400).json({ message: 'Name, email and dealer code are required' })

      const exists = await prisma.dealer.findFirst({ where: { OR: [{ email }, { dealerCode: dealerCode.toUpperCase() }] } })
      if (exists) return res.status(409).json({ message: 'Email or dealer code already in use' })

      const dealer = await prisma.dealer.create({
        data: { name, email, phone, city, dealerCode: dealerCode.toUpperCase(), commissionPct: commissionPct ?? 8 },
      })
      await logEmployeeAction(prisma, req.employee, { action: 'create_dealer', entity: 'Dealer', entityId: dealer.id, ip: req.ip })
      res.status(201).json({ dealer })
    } catch {
      res.status(500).json({ message: 'Server error' })
    }
  })

  router.get('/dealers/:id', requireEmployee, requireRole('DEALER_MANAGEMENT'), async (req, res) => {
    const dealer = await prisma.dealer.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, name: true, city: true, plan: true, approved: true, createdAt: true } },
        payments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' })
    res.json({ dealer })
  })

  router.patch('/dealers/:id', requireEmployee, requireRole('DEALER_MANAGEMENT'), async (req, res) => {
    try {
      const { status, verified, commissionPct } = req.body
      const dealer = await prisma.dealer.update({
        where: { id: req.params.id },
        data: {
          ...(status !== undefined && { status }),
          ...(verified !== undefined && { verified }),
          ...(commissionPct !== undefined && { commissionPct }),
        },
      })
      await logEmployeeAction(prisma, req.employee, {
        action: 'update_dealer', entity: 'Dealer', entityId: dealer.id, ip: req.ip, details: JSON.stringify(req.body),
      })
      res.json({ dealer })
    } catch {
      res.status(404).json({ message: 'Dealer not found' })
    }
  })

  // Dealers can't self-edit a registered member's profile (no dealer login for
  // that) — this is the request/resolution log the Dealer Management role works
  // from instead. See prisma/schema.prisma's DealerEditRequest doc comment.
  router.get('/dealer-edit-requests', requireEmployee, requireRole('DEALER_MANAGEMENT'), async (req, res) => {
    const requests = await prisma.dealerEditRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        dealer: { select: { id: true, name: true, dealerCode: true } },
        resolvedBy: { select: { id: true, name: true, employeeCode: true } },
      },
    })
    res.json({ requests })
  })

  router.post('/dealer-edit-requests', requireEmployee, requireRole('DEALER_MANAGEMENT'), async (req, res) => {
    const { dealerId, targetUserId, description } = req.body
    if (!dealerId || !description) return res.status(400).json({ message: 'dealerId and description are required' })
    const request = await prisma.dealerEditRequest.create({ data: { dealerId, targetUserId, description } })
    await logEmployeeAction(prisma, req.employee, {
      action: 'log_dealer_edit_request', entity: 'DealerEditRequest', entityId: request.id, ip: req.ip,
    })
    res.status(201).json({ request })
  })

  router.patch('/dealer-edit-requests/:id/resolve', requireEmployee, requireRole('DEALER_MANAGEMENT'), async (req, res) => {
    try {
      const request = await prisma.dealerEditRequest.update({
        where: { id: req.params.id },
        data: { status: 'resolved', resolvedById: req.employee.id, resolvedAt: new Date() },
      })
      await logEmployeeAction(prisma, req.employee, {
        action: 'resolve_dealer_edit_request', entity: 'DealerEditRequest', entityId: request.id, ip: req.ip,
      })
      res.json({ request })
    } catch {
      res.status(404).json({ message: 'Request not found' })
    }
  })

  // ── Vendor Management (HR_ADMIN, VENDOR_MANAGEMENT) ──────────────────────────

  router.get('/vendors', requireEmployee, requireRole('VENDOR_MANAGEMENT'), async (req, res) => {
    const { category, city, tier, search } = req.query
    const where = {
      ...(category && { category }),
      ...(city && { city }),
      ...(tier && { tier }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    }
    const vendors = await prisma.vendor.findMany({
      where, orderBy: { sequenceNo: 'asc' },
      include: { _count: { select: { bookings: true, ratings: true, enquiries: true } } },
    })
    const withRatings = await Promise.all(vendors.map(async (v) => {
      const agg = await prisma.vendorRating.aggregate({ where: { vendorId: v.id }, _avg: { rating: true } })
      return { ...serializeVendor(v), avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0 }
    }))
    res.json({ vendors: withRatings })
  })

  router.post('/vendors', requireEmployee, requireRole('VENDOR_MANAGEMENT'), async (req, res) => {
    try {
      const { name, category, email, password, phone, city, tier, price, gst, address, commissionPct } = req.body
      if (!name || !category || !email || !password) {
        return res.status(400).json({ message: 'Name, category, email and password are required' })
      }
      const exists = await prisma.vendor.findUnique({ where: { email } })
      if (exists) return res.status(409).json({ message: 'Email already in use' })

      const hashed = await bcrypt.hash(password, 12)
      const vendor = await createVendorWithId(prisma, {
        name, category, email, password: hashed, phone, city,
        tier: tier || 'standard', price, gst, address, commissionPct: commissionPct ?? 10,
      })
      await logEmployeeAction(prisma, req.employee, { action: 'create_vendor', entity: 'Vendor', entityId: vendor.id, ip: req.ip })
      res.status(201).json({ vendor: serializeVendor(vendor) })
    } catch (err) {
      res.status(err.message?.includes('Unknown vendor category') ? 400 : 500).json({ message: err.message || 'Server error' })
    }
  })

  router.get('/vendors/:id', requireEmployee, requireRole('VENDOR_MANAGEMENT'), async (req, res) => {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
        payments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
        ratings: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
        enquiries: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' })

    const cancelledBookings = vendor.bookings.filter((b) => b.status === 'CANCELLED')
    const avgRating = vendor.ratings.length ? vendor.ratings.reduce((s, r) => s + r.rating, 0) / vendor.ratings.length : 0
    res.json({ vendor: serializeVendor(vendor), cancelledBookings, avgRating: Math.round(avgRating * 10) / 10 })
  })

  router.patch('/vendors/:id', requireEmployee, requireRole('VENDOR_MANAGEMENT'), async (req, res) => {
    try {
      const { status, verified, tier, commissionPct, price, gst, address, phone, city } = req.body
      const vendor = await prisma.vendor.update({
        where: { id: req.params.id },
        data: {
          ...(status !== undefined && { status }),
          ...(verified !== undefined && { verified }),
          ...(tier !== undefined && { tier }),
          ...(commissionPct !== undefined && { commissionPct }),
          ...(price !== undefined && { price }),
          ...(gst !== undefined && { gst }),
          ...(address !== undefined && { address }),
          ...(phone !== undefined && { phone }),
          ...(city !== undefined && { city }),
        },
      })
      await logEmployeeAction(prisma, req.employee, {
        action: 'update_vendor', entity: 'Vendor', entityId: vendor.id, ip: req.ip, details: JSON.stringify(req.body),
      })
      res.json({ vendor: serializeVendor(vendor) })
    } catch {
      res.status(404).json({ message: 'Vendor not found' })
    }
  })

  // Vendor feedback/complaint resolution — the Vendor Management role's other main
  // job (Task 7). contactLog records the 1:1 contact made with the vendor.
  router.get('/vendor-complaints', requireEmployee, requireRole('VENDOR_MANAGEMENT'), async (req, res) => {
    const complaints = await prisma.vendorComplaint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { id: true, name: true, vendorId: true } },
        user: { select: { id: true, name: true } },
        handledBy: { select: { id: true, name: true, employeeCode: true } },
      },
    })
    res.json({ complaints })
  })

  router.post('/vendor-complaints', requireEmployee, requireRole('VENDOR_MANAGEMENT'), async (req, res) => {
    const { vendorId, userId, description, contactLog } = req.body
    if (!vendorId || !description) return res.status(400).json({ message: 'vendorId and description are required' })
    const complaint = await prisma.vendorComplaint.create({
      data: { vendorId, userId, description, contactLog, handledById: req.employee.id },
    })
    await logEmployeeAction(prisma, req.employee, {
      action: 'log_vendor_complaint', entity: 'VendorComplaint', entityId: complaint.id, ip: req.ip,
    })
    res.status(201).json({ complaint })
  })

  router.patch('/vendor-complaints/:id/resolve', requireEmployee, requireRole('VENDOR_MANAGEMENT'), async (req, res) => {
    try {
      const { contactLog } = req.body
      const complaint = await prisma.vendorComplaint.update({
        where: { id: req.params.id },
        data: { status: 'resolved', resolvedAt: new Date(), handledById: req.employee.id, ...(contactLog !== undefined && { contactLog }) },
      })
      await logEmployeeAction(prisma, req.employee, {
        action: 'resolve_vendor_complaint', entity: 'VendorComplaint', entityId: complaint.id, ip: req.ip,
      })
      res.json({ complaint })
    } catch {
      res.status(404).json({ message: 'Complaint not found' })
    }
  })

  return router
}

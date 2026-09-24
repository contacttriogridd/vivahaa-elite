// Dealer self-service portal API (Panel 1). Every route below is scoped to
// req.dealer.id (set by authenticateDealer) — a dealer can only ever see users
// carrying their own dealerId, never another dealer's or any admin/vendor data.
import express from 'express'
import bcrypt from 'bcryptjs'
import { signDealerToken, authenticateDealer } from '../lib/rbac.js'
import { logEmployeeAction } from '../lib/rbac.js'
import { suggestMatches } from '../lib/matchSuggestion.js'
import { sendMail } from '../lib/mailer.js'

const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  maxAge: 8 * 3600000,
})

const serializeDealer = ({ password, ...rest }) => rest
const serializeUser = ({ password, ...rest }) => rest

const DAY_MS = 86400000

// Differentiated reminder copy (Task 8: "DIFFERENTIATED messages per reason, not
// generic"). Keyed by reason so both the list endpoint (what applies to a user right
// now) and the send endpoint (what to actually write) share one source of truth.
const REMINDER_REASONS = {
  unpaid: {
    label: 'Payment pending',
    title: 'Complete your registration',
    message: "Your profile is almost ready — finish your payment to activate full access and start receiving matches.",
  },
  inactive_5_7: {
    label: 'Inactive 5-7 days',
    title: 'We\'ve missed you',
    message: "It's been a few days since you last checked in — new profiles may be waiting for you. Log back in and take a look.",
  },
  inactive_7_plus: {
    label: 'Inactive 7+ days',
    title: 'Your matches are waiting',
    message: "It's been over a week since your last visit. Don't miss out on potential matches — come back and check your profile today.",
  },
}

/** Which reminder reasons currently apply to a given onboarded user. */
function applicableReasons(user, now = new Date()) {
  const reasons = []
  if (user.feeStatus !== 'paid') reasons.push('unpaid')
  const lastSeen = user.lastActiveAt || user.lastLogin || user.createdAt
  const daysInactive = Math.floor((now - new Date(lastSeen)) / DAY_MS)
  if (daysInactive >= 7) reasons.push('inactive_7_plus')
  else if (daysInactive >= 5) reasons.push('inactive_5_7')
  return reasons
}

export function createDealerRouter(prisma) {
  const router = express.Router()
  const requireDealer = authenticateDealer(prisma)

  // POST /api/dealer/login — kept for parity with the vendor portal's own /login,
  // even though the unified POST /api/auth/login also handles dealers now.
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body
      if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

      const dealer = await prisma.dealer.findUnique({ where: { email } })
      if (!dealer || !dealer.password) return res.status(401).json({ message: 'Invalid email or password' })

      const valid = await bcrypt.compare(password, dealer.password)
      if (!valid) return res.status(401).json({ message: 'Invalid email or password' })
      if (dealer.status !== 'active') return res.status(403).json({ message: 'Account is not active' })

      const accessToken = signDealerToken(dealer)
      res.cookie('dealerAccessToken', accessToken, cookieOpts())
      res.json({ accessToken, dealer: serializeDealer(dealer) })
    } catch {
      res.status(500).json({ message: 'Server error' })
    }
  })

  router.post('/logout', (req, res) => {
    res.clearCookie('dealerAccessToken')
    res.json({ message: 'Logged out' })
  })

  // GET /api/dealer/me
  router.get('/me', requireDealer, (req, res) => {
    res.json({ dealer: serializeDealer(req.dealer) })
  })

  // GET /api/dealer/users — everyone onboarded through this dealer's promo code
  // (User.dealerId — there's no separate promoCode field, dealerCode already is one;
  // see the Dealer model's own doc comment).
  router.get('/users', requireDealer, async (req, res) => {
    const users = await prisma.user.findMany({
      where: { dealerId: req.dealer.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true, city: true, gender: true,
        plan: true, tier: true, feeStatus: true, status: true, approved: true,
        lastActiveAt: true, lastLogin: true, createdAt: true,
      },
    })
    res.json({ dealerCode: req.dealer.dealerCode, users, total: users.length })
  })

  // GET /api/dealer/users/:userId/suggestions — same-tier-only candidates for one of
  // this dealer's own onboarded users. Reuses the existing suggestMatches scorer
  // (Task 8: "reuse the existing match-suggestion mechanism, not a second one") with
  // the sameTierOnly hard filter — a dealer never sees cross-tier candidates, at the
  // query level, not just hidden in the UI.
  router.get('/users/:userId/suggestions', requireDealer, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } })
    if (!user || user.dealerId !== req.dealer.id) return res.status(404).json({ message: 'User not found' })
    const suggestions = await suggestMatches(prisma, user, 10, { sameTierOnly: true })
    res.json({ user: serializeUser(user), suggestions })
  })

  // POST /api/dealer/users/:userId/send-match — curated-match send, mirroring the
  // admin User Management action (POST /api/admin/engagement/:userId/actions,
  // type=match_suggestion): writes the same Notification shape to the member, plus
  // an AuditLog entry attributing the dealer (AuditLog.adminId is a loose string, not
  // an FK — already used this way for employees). targetUserId's tier is
  // re-verified server-side even though the suggestions endpoint already filtered to
  // same-tier — a client could otherwise send an arbitrary targetUserId directly.
  router.post('/users/:userId/send-match', requireDealer, async (req, res) => {
    const { targetUserId, note } = req.body
    if (!targetUserId) return res.status(400).json({ message: 'targetUserId is required' })

    const user = await prisma.user.findUnique({ where: { id: req.params.userId } })
    if (!user || user.dealerId !== req.dealer.id) return res.status(404).json({ message: 'User not found' })

    const target = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!target) return res.status(404).json({ message: 'Match candidate not found' })
    if (target.plan !== user.plan) {
      return res.status(403).json({ message: 'Match candidates must be the same membership tier' })
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'A curated match for you',
        message: note || "Our team found a profile we think you'll like — check your matches.",
        type: 'match_suggestion',
      },
    })
    await logEmployeeAction(prisma, { id: req.dealer.id }, {
      action: 'dealer_match_suggestion', entity: 'User', entityId: user.id, ip: req.ip,
      details: JSON.stringify({ targetUserId, note, dealerId: req.dealer.id }),
    })
    res.status(201).json({ message: 'Match sent' })
  })

  // GET /api/dealer/reminders — this dealer's onboarded users who currently qualify
  // for a reminder (unpaid and/or inactive 5+ days), each tagged with which specific
  // reasons apply (Task 8: differentiated, not generic).
  router.get('/reminders', requireDealer, async (req, res) => {
    const users = await prisma.user.findMany({
      where: { dealerId: req.dealer.id, status: 'active' },
      select: {
        id: true, name: true, email: true, phone: true, feeStatus: true,
        lastActiveAt: true, lastLogin: true, createdAt: true,
      },
    })
    const flagged = users
      .map((u) => ({ ...u, reasons: applicableReasons(u) }))
      .filter((u) => u.reasons.length > 0)
    res.json({
      reasonCatalog: Object.fromEntries(Object.entries(REMINDER_REASONS).map(([k, v]) => [k, v.label])),
      users: flagged,
    })
  })

  // POST /api/dealer/reminders/:userId/send — sends the one differentiated message
  // for `reason` (Notification + best-effort email via the existing mailer). The
  // reason is re-validated as currently applicable, not trusted blindly from the
  // client.
  router.post('/reminders/:userId/send', requireDealer, async (req, res) => {
    const { reason } = req.body
    if (!REMINDER_REASONS[reason]) return res.status(400).json({ message: 'Invalid reason' })

    const user = await prisma.user.findUnique({ where: { id: req.params.userId } })
    if (!user || user.dealerId !== req.dealer.id) return res.status(404).json({ message: 'User not found' })
    if (!applicableReasons(user).includes(reason)) {
      return res.status(409).json({ message: 'This reminder no longer applies to this user' })
    }

    const copy = REMINDER_REASONS[reason]
    await prisma.notification.create({
      data: { userId: user.id, title: copy.title, message: copy.message, type: `dealer_reminder_${reason}` },
    })
    if (user.email) {
      await sendMail({ to: user.email, subject: copy.title, text: copy.message, html: `<p>${copy.message}</p>` })
    }
    await logEmployeeAction(prisma, { id: req.dealer.id }, {
      action: 'dealer_reminder', entity: 'User', entityId: user.id, ip: req.ip,
      details: JSON.stringify({ reason, dealerId: req.dealer.id }),
    })
    res.status(201).json({ message: 'Reminder sent' })
  })

  return router
}

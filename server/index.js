import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') })

const __dirname = dirname(fileURLToPath(import.meta.url))
// City-centroid lookup for the platform's known service cities — see the file's own
// `meta` block for why this exists instead of a geocoding API call.
const CITY_GEO = JSON.parse(
  readFileSync(join(__dirname, '..', 'src', 'data', 'taxonomy', 'cityGeo.json'), 'utf-8')
).cities

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.BACKEND_PORT || 4000

// Security
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '10kb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { message: 'Too many requests, please try again later.' },
})
app.use('/api/auth', limiter)

// JWT helpers
const generateAccessToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role || 'user' },
  process.env.JWT_SECRET || 'fallback-secret',
  { expiresIn: process.env.JWT_EXPIRY || '15m' }
)

const generateRefreshToken = (user) => jwt.sign(
  { id: user.id },
  process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
)

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Authentication required' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) return res.status(401).json({ message: 'User not found' })
    req.user = user
    next()
  } catch { return res.status(401).json({ message: 'Invalid or expired token' }) }
}

// ── Auth Routes ──────────────────────────────────────────────────────────────

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) return res.status(401).json({ message: 'Invalid email or password' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' })

    if (user.status === 'suspended') return res.status(403).json({ message: 'Account is suspended' })

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    await prisma.session.create({
      data: { userId: user.id, token: accessToken, refreshToken, expiresAt: new Date(Date.now() + 7 * 86400000) }
    })

    const cookieMaxAge = rememberMe ? 30 * 86400000 : 86400000
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', maxAge: cookieMaxAge })
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', maxAge: 7 * 86400000 })

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })

    res.json({ accessToken, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, tier: user.tier, plan: user.plan } })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      email, password, name, mobile, gender, dob,
      religion, caste, subcaste, kulam, community = {},
      motherTongue, occupation, income, location, qualification,
      family = {}, horoscope = {},
      // Previously collected by the wizard and silently dropped by this route —
      // see prisma/schema.prisma's User model for why each of these exists now.
      height, weight, bloodGroup,
      foodPreference, hobbies, lifestyleInterests, languagesKnown, languagePreference,
      partnerAgeRange, partnerReligion, partnerLocation,
      noHoroscopeChart,
      profileCompletion,
      // Sensitive block. Deliberately destructured out so it can never be spread
      // onto the User row alongside the public fields.
      private: sensitive = {},
    } = req.body
    if (!email || !password || !name) return res.status(400).json({ message: 'Name, email and password are required' })

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(409).json({ message: 'Email already registered' })

    const hashed = await bcrypt.hash(password, 12)
    const geo = location && CITY_GEO[location] ? CITY_GEO[location] : null

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          password: hashed,
          name,
          phone: mobile,
          gender,
          dob,
          religion,
          caste,
          subcaste,
          kulam,
          religionId: community.religionId,
          casteId: community.casteId,
          subcasteId: community.subcasteId,
          kulamId: community.kulamId,
          motherTongue,
          familyType: family.familyType,
          education: qualification,
          occupation,
          income,
          city: location,
          latitude: geo?.lat ?? null,
          longitude: geo?.lng ?? null,
          height,
          weight,
          bloodGroup,
          foodPreference,
          hobbies,
          lifestyleInterests,
          languagesKnown,
          languagePreference,
          partnerAgeRange,
          partnerReligion,
          partnerLocation,
          birthTime: horoscope.birthTime,
          birthPlace: horoscope.birthPlace,
          nakshatra: horoscope.nakshatra,
          rashi: horoscope.rasi,
          noHoroscopeChart: Boolean(noHoroscopeChart),
          profileCompletion: Number.isFinite(profileCompletion) ? profileCompletion : 10,
        },
      })

      // Private data lands in its own table, with every `show*` flag left at its
      // default of false. Nothing here reaches a public profile until the member
      // opts in field by field.
      await tx.privateProfile.create({
        data: {
          userId: created.id,
          maritalStatus: sensitive.maritalStatus,
          hasChildren: sensitive.hasChildren === 'yes',
          divorceDecreeConfirmed: Boolean(sensitive.divorceDecreeConfirmed),
          widowDeclarationConfirmed: Boolean(sensitive.widowDeclarationConfirmed),
          spousePassedOn: sensitive.spousePassedOn || null,
          totalAssetValue: sensitive.totalAssetValue || null,
          children: {
            create: (sensitive.children || []).map((child) => ({
              age: child.age || null,
              livesWithMember: child.livesWithMe || null,
            })),
          },
        },
      })

      const parents = [
        { role: 'father', ...(family.father || {}), phone: sensitive.fatherPhone },
        { role: 'mother', ...(family.mother || {}), phone: sensitive.motherPhone },
      ].filter((parent) => parent.name || parent.occupation || parent.phone)

      if (parents.length) {
        await tx.parent.createMany({
          data: parents.map((parent) => ({
            userId: created.id,
            role: parent.role,
            name: parent.name || null,
            occupation: parent.occupation || null,
            phone: parent.phone || null,
          })),
        })
      }

      if ((family.siblings || []).length) {
        await tx.sibling.createMany({
          data: family.siblings.map((sibling) => ({
            userId: created.id,
            name: sibling.name || null,
            gender: sibling.gender || null,
            maritalStatus: sibling.maritalStatus || null,
          })),
        })
      }

      // The wizard only ever sends the *name* of an attached document today (no
      // actual file upload wiring exists yet) — record it as a real, private
      // ProfileDocument row rather than a loose string, so admin review has
      // somewhere real to look. `storageKey` is a placeholder until file upload
      // is built; nothing here is ever served to another member.
      if (sensitive.divorceDocumentName) {
        await tx.profileDocument.create({
          data: {
            userId: created.id,
            kind: 'divorce_decree',
            fileName: sensitive.divorceDocumentName,
            storageKey: `pending-upload/${created.id}/${sensitive.divorceDocumentName}`,
          },
        })
      }

      return created
    })

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', maxAge: 86400000 })

    res.status(201).json({ accessToken, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) { res.status(500).json({ message: 'Server error' }) }
})

// POST /api/auth/logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.cookies?.accessToken
    if (token) { await prisma.session.deleteMany({ where: { token } }) }
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out successfully' })
  } catch { res.json({ message: 'Logged out' }) }
})

// POST /api/auth/refresh
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' })

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret')
    const session = await prisma.session.findFirst({ where: { refreshToken, userId: decoded.id } })
    if (!session) return res.status(401).json({ message: 'Invalid session' })

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) return res.status(401).json({ message: 'User not found' })

    const newAccessToken = generateAccessToken(user)
    res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', maxAge: 86400000 })

    res.json({ accessToken: newAccessToken })
  } catch { res.status(401).json({ message: 'Invalid refresh token' }) }
})

// GET /api/auth/profile
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, name: req.user.name, avatar: req.user.avatar, tier: req.user.tier, plan: req.user.plan, profileCompletion: req.user.profileCompletion })
})

// GET /api/auth/google
app.get('/api/auth/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    // Demo mode: auto-login
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?demo=google`)
  }
  // In production, redirect to Google OAuth
  const redirectUri = `${process.env.BACKEND_URL || `http://localhost:${PORT}`}/api/auth/google/callback`
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=profile%20email`
  res.redirect(url)
})

// POST /api/auth/google-login (demo/dev fallback)
app.post('/api/auth/google-login', async (req, res) => {
  const { name, email, avatar } = req.body
  if (!email) return res.status(400).json({ message: 'Email required' })

  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({ data: { email, name: name || email.split('@')[0], avatar, emailVerified: true, profileCompletion: 20 } })
  }

  const accessToken = generateAccessToken(user)
  res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax' })
  res.json({ accessToken, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, tier: user.tier } })
})

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.json({ message: 'If the email exists, a reset link has been sent' })

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  await prisma.oTP.create({
    data: { userId: user.id, code: otp, type: 'password_reset', expiresAt: new Date(Date.now() + 600000) }
  })

  // In production, send email via nodemailer
  console.log(`[DEV] OTP for ${email}: ${otp}`)
  res.json({ message: 'OTP sent to your email', devOtp: process.env.NODE_ENV === 'development' ? otp : undefined })
})

// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(400).json({ message: 'User not found' })

  const valid = await prisma.oTP.findFirst({
    where: { userId: user.id, code: otp, type: 'password_reset', used: false, expiresAt: { gt: new Date() } }
  })
  if (!valid) return res.status(400).json({ message: 'Invalid or expired OTP' })

  await prisma.oTP.update({ where: { id: valid.id }, data: { used: true } })
  res.json({ message: 'OTP verified', token: jwt.sign({ id: user.id, purpose: 'reset' }, process.env.JWT_SECRET || 'fallback', { expiresIn: '10m' }) })
})

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback')
    if (decoded.purpose !== 'reset') return res.status(400).json({ message: 'Invalid token' })
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { id: decoded.id }, data: { password: hashed } })
    res.json({ message: 'Password reset successfully' })
  } catch { res.status(400).json({ message: 'Invalid or expired token' }) }
})

// Demo user endpoints (development only)
app.post('/api/auth/demo-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ message: 'Not available in production' })
  const { role } = req.body
  if (role === 'admin') {
    return res.json({ user: { id: 'admin-demo', email: process.env.DEMO_ADMIN_EMAIL, name: 'Admin', role: 'admin' }, accessToken: 'demo-admin-token' })
  }
  return res.json({ user: { id: 'user-demo', email: process.env.DEMO_USER_EMAIL, name: 'Demo User', role: 'user' }, accessToken: 'demo-user-token' })
})

// ── Taxonomy ─────────────────────────────────────────────────────────────────

// GET /api/taxonomy
// Serves the admin-curated religion -> caste -> subcaste tree from the database so an
// admin tool can edit it without a frontend rebuild. While the table is empty the
// client falls back to the seed JSON in src/data/taxonomy/. See that folder's README
// for the rules that apply before anything is inserted here.
app.get('/api/taxonomy', async (req, res) => {
  try {
    const rows = await prisma.casteTaxonomy.findMany({
      where: { active: true },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    })
    res.json({ source: rows.length ? 'database' : 'seed-json', entries: rows })
  } catch {
    res.status(500).json({ message: 'Could not load the community taxonomy' })
  }
})

// ── Horoscope ────────────────────────────────────────────────────────────────

// POST /api/horoscope/compute
//
// NOT IMPLEMENTED — this is an integration task, not a coding oversight.
//
// Computing a chart means deriving sidereal planetary longitudes, the lagna, the
// nakshatra and its pada from a date, an exact local time, and the latitude/longitude
// and historical timezone of the birth place. That needs a real ephemeris. Options:
//
//   • Swiss Ephemeris — the reference implementation. Node bindings exist
//     (`swisseph`). AGPL, or a commercial licence.
//   • A hosted panchang/jyotish API, if you would rather not run the ephemeris
//     yourself. Check the licence terms for redistributing computed charts.
//
// You will also need a geocoder to turn `place` into coordinates, and a historical
// timezone database (IST has not always been IST) to resolve the birth instant.
//
// Under NO circumstances should this route be filled in by asking a language model
// for planetary positions. It will answer confidently and it will be wrong, and no
// caller can tell the difference. If the ephemeris is unavailable, return this 501 —
// the client is written to show the user an honest message and carry on.
app.post('/api/horoscope/compute', authMiddleware, async (req, res) => {
  const { date, time, place } = req.body || {}
  if (!date || !time || !place) {
    return res.status(400).json({ message: 'Date, time, and place of birth are all required.' })
  }
  return res.status(501).json({
    message:
      'Horoscope calculation is not connected yet. Your birth details have been saved and we will generate your chart once it is available.',
    integration: 'Requires an ephemeris-backed calculation service. See server/index.js.',
  })
})

// POST /api/horoscope/summarise
//
// The one place a language model belongs in this flow: turning an ALREADY-COMPUTED
// chart into readable prose. It takes a chart as input, so it cannot be used to invent
// one. Guard that invariant if you implement this — reject any request whose chart did
// not come from /compute.
app.post('/api/horoscope/summarise', authMiddleware, async (req, res) => {
  const { chart } = req.body || {}
  if (!chart?.placements?.length) {
    return res.status(400).json({ message: 'A computed chart is required.' })
  }
  return res.status(501).json({
    message: 'Chart summaries are not enabled yet.',
  })
})

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\n  ✦ Vivahaa Elite Backend Server ✦`)
  console.log(`  ─────────────────────────────`)
  console.log(`  Server running on port ${PORT}`)
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`  API: http://localhost:${PORT}/api\n`)
})

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
import { createAdminRouter } from './routes/admin.js'
import { createVendorRouter } from './routes/vendor.js'
import { signEmployeeToken, signVendorToken } from './lib/rbac.js'
import { createRegistrationRouter } from './routes/registration.js'
import { createPaymentsRouter } from './routes/payments.js'

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
// Registration drafts carry a base64 photo (see "Photo storage" decision in the
// registration rebuild plan) — 10kb is nowhere near enough for that, so the limit is
// raised here. `verify` stashes the exact raw bytes on `req.rawBody`, which the
// Razorpay webhook needs to recompute its HMAC signature over (JSON.stringify(req.body)
// is not guaranteed to reproduce the exact bytes Razorpay signed).
app.use(express.json({
  limit: '6mb',
  verify: (req, _res, buf) => { req.rawBody = buf },
}))

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

/**
 * Shared shape for "the signed-in user's own full profile," used identically by
 * register, login, and GET /api/auth/profile — so the dashboard has the complete
 * picture immediately after registering or logging in, not only after a reload
 * re-triggers the profile fetch. `full` must include the `privateProfile` relation.
 * Never reuse this for another user's profile — see the note on GET /api/auth/profile.
 */
const serializeOwnProfile = (full) => {
  const { password, privateProfile, ...publicFields } = full
  return {
    ...publicFields,
    private: privateProfile
      ? {
          maritalStatus: privateProfile.maritalStatus,
          hasChildren: privateProfile.hasChildren,
          divorceDecreeConfirmed: privateProfile.divorceDecreeConfirmed,
          widowDeclarationConfirmed: privateProfile.widowDeclarationConfirmed,
          spousePassedOn: privateProfile.spousePassedOn,
          totalAssetValue: privateProfile.totalAssetValue,
        }
      : null,
  }
}

const serializeEmployee = ({ password, ...rest }) => rest
const serializeVendor = ({ password, ...rest }) => rest
const employeeCookieOpts = () => ({ httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', maxAge: 8 * 3600000 })

// ── Auth Routes ──────────────────────────────────────────────────────────────

// POST /api/auth/login — the single sign-in form on the site authenticates every
// account type (member, vendor, employee/admin) through this one endpoint. Each
// account type keeps its own table, its own password hash, and — critically — its
// own token type/cookie/signing function exactly as before this was unified: a
// vendor still gets a vendor-scoped JWT via signVendorToken, an employee still gets
// one carrying their RBAC role via signEmployeeToken. Unifying only changed how
// credentials are looked up up front; every downstream authenticateEmployee/
// authenticateVendor/authMiddleware check (and the role gating built on top of
// them) is untouched. Dealers are deliberately not checked here — there is no
// real dealer account/password in this schema (see Task 7: dealer corrections go
// through an employee-managed request log, not a dealer login).
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (user && user.password && await bcrypt.compare(password, user.password)) {
      if (user.status === 'suspended') return res.status(403).json({ message: 'Account is suspended' })

      const accessToken = generateAccessToken(user)
      const refreshToken = generateRefreshToken(user)
      await prisma.session.create({
        data: { userId: user.id, token: accessToken, refreshToken, expiresAt: new Date(Date.now() + 7 * 86400000) }
      })

      const cookieMaxAge = rememberMe ? 30 * 86400000 : 86400000
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', maxAge: cookieMaxAge })
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', maxAge: 7 * 86400000 })

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date(), lastActiveAt: new Date() },
        include: { privateProfile: true },
      })
      return res.json({ accountType: 'member', accessToken, user: serializeOwnProfile(updated) })
    }

    const employee = await prisma.employee.findUnique({ where: { email } })
    if (employee && employee.active && await bcrypt.compare(password, employee.password)) {
      const accessToken = signEmployeeToken(employee)
      res.cookie('employeeAccessToken', accessToken, employeeCookieOpts())
      return res.json({ accountType: 'employee', accessToken, employee: serializeEmployee(employee) })
    }

    const vendor = await prisma.vendor.findUnique({ where: { email } })
    if (vendor && await bcrypt.compare(password, vendor.password)) {
      if (vendor.status !== 'active') return res.status(403).json({ message: 'Account is not active' })
      const accessToken = signVendorToken(vendor)
      res.cookie('vendorAccessToken', accessToken, employeeCookieOpts())
      return res.json({ accountType: 'vendor', accessToken, vendor: serializeVendor(vendor) })
    }

    return res.status(401).json({ message: 'Invalid email or password' })
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

    // Re-fetch with privateProfile included — the transaction's `created` is a bare
    // user row with no relations, and the dashboard needs the full picture the
    // moment registration succeeds, not only after a later reload.
    const full = await prisma.user.findUnique({ where: { id: user.id }, include: { privateProfile: true } })
    res.status(201).json({ accessToken, user: serializeOwnProfile(full) })
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
//
// Returns the authenticated user's own full profile — this is "my profile," so
// including their own PrivateProfile fields under `private` is fine (a user seeing
// their own private data is not the leak the PrivateProfile isolation pattern guards
// against). Any OTHER-facing route — the browse/search endpoint from Phase 5 — must
// never do this; it may only read privateProfile fields the owner has explicitly
// opted to show via that model's show* flags.
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  const full = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { privateProfile: true },
  })
  if (!full) return res.status(404).json({ message: 'User not found' })

  await prisma.user.update({ where: { id: full.id }, data: { lastActiveAt: new Date() } })
  res.json(serializeOwnProfile(full))
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

// ── Browse / Search ──────────────────────────────────────────────────────────

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * dob is stored as a plain "YYYY-MM-DD" string (see prisma/schema.prisma), not a
 * DateTime — but that format sorts and range-compares lexicographically exactly
 * like a real date would, so Prisma's ordinary string gte/lte/asc/desc all just
 * work without a schema change or a raw query.
 */
const dobBoundForAge = (age) => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - Number(age))
  return d.toISOString().slice(0, 10)
}

const ageFromDob = (dob) => {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const diffMs = Date.now() - birth.getTime()
  return Math.floor(diffMs / (365.25 * 24 * 3600 * 1000))
}

const resolveSort = (sort) => {
  switch (sort) {
    case 'active':
      return { lastActiveAt: 'desc' }
    // "Ascending" means youngest first, which is the LARGER (more recent) dob
    // string — see the note on dobBoundForAge above.
    case 'age-asc':
      return { dob: 'desc' }
    case 'age-desc':
      return { dob: 'asc' }
    case 'match-score':
      // Not available until Phase 8's horoscope scorer exists. Falls back to
      // newest rather than erroring, so the client doesn't need to know yet
      // whether this sort option is live.
      return { createdAt: 'desc' }
    case 'newest':
    default:
      return { createdAt: 'desc' }
  }
}

/**
 * Privacy-respecting projection for someone ELSE's profile in a results list — the
 * opposite of GET /api/auth/profile, which returns a user's own full data. This must
 * never spread PrivateProfile wholesale; a field from it appears here only when its
 * matching show* flag is true, exactly like the wizard's privacy model intends.
 * `photoVisibility: 'blurred'` is enforced by omitting the avatar outright for now —
 * a real blur-vs-full distinction based on connection state is Phase 10's job.
 */
const serializeProfileCard = (u, distanceKm) => ({
  id: u.id,
  name: u.name,
  avatar: u.photoVisibility === 'blurred' ? null : u.avatar,
  gender: u.gender,
  age: ageFromDob(u.dob),
  religion: u.religion,
  caste: u.caste,
  subcaste: u.subcaste,
  motherTongue: u.motherTongue,
  city: u.city,
  education: u.education,
  occupation: u.occupation,
  height: u.height,
  foodPreference: u.foodPreference,
  nakshatra: u.nakshatra,
  rashi: u.rashi,
  idVerified: u.idVerified,
  photoVerified: u.photoVerified,
  videoVerified: u.videoVerified,
  profileCompletion: u.profileCompletion,
  maritalStatus: u.privateProfile?.showMaritalStatus ? u.privateProfile.maritalStatus : undefined,
  ...(distanceKm != null ? { distanceKm: Math.round(distanceKm * 10) / 10 } : {}),
})

// GET /api/profiles
//
// Paginated browse/search. Two branches:
//   - Plain filters: an ordinary Prisma query with cursor pagination.
//   - Radius search (radiusKm + centerLat + centerLng given): distance can't be
//     expressed as a Prisma where-clause, so this fetches a bounded candidate set
//     (already narrowed by every other filter, and to only rows with coordinates —
//     see the Phase 1 note on cityGeo.json for why not every profile has any) and
//     computes Haversine distance in JS, sorted nearest-first. No cursor pagination
//     on this branch — fine at the platform's current city-list-bounded scale;
//     revisit if/when a real geocoder replaces the static lookup.
app.get('/api/profiles', authMiddleware, async (req, res) => {
  try {
    const {
      gender, religionId, casteId, subcasteId, motherTongue, maritalStatus,
      location, radiusKm, centerLat, centerLng,
      education, occupation, foodPreference, nakshatra, rashi,
      ageMin, ageMax, hasPhoto, verifiedOnly,
      sort = 'newest', cursor, limit,
    } = req.query

    const take = Math.min(parseInt(limit, 10) || 20, 50)

    const where = {
      id: { not: req.user.id },
      status: 'active',
      approved: true,
    }
    if (gender) where.gender = gender
    if (religionId) where.religionId = religionId
    if (casteId) where.casteId = casteId
    if (subcasteId) where.subcasteId = subcasteId
    if (motherTongue) where.motherTongue = { equals: motherTongue, mode: 'insensitive' }
    if (location) where.city = { contains: location, mode: 'insensitive' }
    if (education) where.education = { contains: education, mode: 'insensitive' }
    if (occupation) where.occupation = { contains: occupation, mode: 'insensitive' }
    if (foodPreference) where.foodPreference = foodPreference
    if (nakshatra) where.nakshatra = nakshatra
    if (rashi) where.rashi = rashi
    if (hasPhoto === 'true') where.avatar = { not: null }
    if (verifiedOnly === 'true') where.idVerified = true

    if (ageMin || ageMax) {
      where.dob = {}
      if (ageMax) where.dob.gte = dobBoundForAge(Number(ageMax) + 1)
      if (ageMin) where.dob.lte = dobBoundForAge(Number(ageMin))
    }

    // Marital status is private by default (see PrivateProfile in the schema) — only
    // match profiles whose owner has opted to show it, rather than letting a search
    // filter reach past that opt-in.
    if (maritalStatus) {
      where.privateProfile = { is: { maritalStatus, showMaritalStatus: true } }
    }

    if (radiusKm && centerLat && centerLng) {
      const lat = Number(centerLat)
      const lng = Number(centerLng)
      const radius = Number(radiusKm)

      const candidates = await prisma.user.findMany({
        where: { ...where, latitude: { not: null }, longitude: { not: null } },
        include: { privateProfile: true },
        take: 500,
      })

      const withDistance = candidates
        .map((u) => ({ u, d: haversineKm(lat, lng, u.latitude, u.longitude) }))
        .filter(({ d }) => d <= radius)
        .sort((a, b) => a.d - b.d)
        .slice(0, take)

      return res.json({
        profiles: withDistance.map(({ u, d }) => serializeProfileCard(u, d)),
        nextCursor: null,
      })
    }

    const orderBy = resolveSort(sort)
    const results = await prisma.user.findMany({
      where,
      orderBy,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { privateProfile: true },
    })

    const hasMore = results.length > take
    const page = hasMore ? results.slice(0, take) : results

    res.json({
      profiles: page.map((u) => serializeProfileCard(u)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
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

// Admin panel (employee auth + RBAC-gated sections) and vendor self-service portal —
// see server/lib/rbac.js for why these use their own JWT cookies/middleware
// distinct from the member authMiddleware above.
app.use('/api/admin', limiter, createAdminRouter(prisma))
app.use('/api/vendor', limiter, createVendorRouter(prisma))

// Public registration wizard drafts + Razorpay-gated membership checkout — see
// server/routes/registration.js and server/routes/payments.js. `limiter` is the same
// window as /api/auth; the webhook itself is not rate-limited by IP since Razorpay's
// own infra is the caller, not a browser.
app.use('/api/registration', limiter, createRegistrationRouter(prisma))
app.use('/api/payments', createPaymentsRouter(prisma))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ message: 'Internal server error' })
})

// Only bind a port when this file is actually run directly (`node server/index.js`,
// i.e. local dev / a real long-running host). When Vercel imports `app` as a
// serverless function (see api/[...path].js), it invokes the exported Express app
// as a plain request handler per-invocation — calling .listen() there would be at
// best wasted and at worst fight the platform's own request handling.
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`\n  ✦ Vivahaa Elite Backend Server ✦`)
    console.log(`  ─────────────────────────────`)
    console.log(`  Server running on port ${PORT}`)
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`  API: http://localhost:${PORT}/api\n`)
  })
}

export default app

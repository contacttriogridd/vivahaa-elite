// Demo data for the admin panel sections built in Task 2-7 (Payments, Engagement,
// Post-Match, Enquiries, Dealers, Vendors, Employees) — separate from seed.js's
// minimal auth-bootstrap accounts because this is considerably more data, purely
// for making every new screen demoable/testable out of the box. Idempotent: each
// block checks for its own marker row before inserting.
import bcrypt from 'bcryptjs'
import { createEmployeeWithId } from '../server/lib/employeeId.js'
import { createVendorWithId } from '../server/lib/vendorId.js'
import { isElitePlanTier } from '../server/lib/plans.js'

export async function seedAdminDemo(prisma) {
  // ── Employees, one per scoped role (HR_ADMIN + USER_MANAGEMENT already exist
  // from seed.js / earlier manual testing) ────────────────────────────────────
  const employeeSeeds = [
    { email: 'usermgr@vivahaaelite.demo', name: 'User Mgmt Employee', role: 'USER_MANAGEMENT', password: 'UserMgr@123' },
    { email: 'vendormgr@vivahaaelite.demo', name: 'Vendor Mgmt Employee', role: 'VENDOR_MANAGEMENT', password: 'VendorMgr@123' },
    { email: 'dealermgr@vivahaaelite.demo', name: 'Dealer Mgmt Employee', role: 'DEALER_MANAGEMENT', password: 'DealerMgr@123' },
  ]
  for (const seed of employeeSeeds) {
    const exists = await prisma.employee.findUnique({ where: { email: seed.email } })
    if (exists) continue
    const hashed = await bcrypt.hash(seed.password, 12)
    await createEmployeeWithId(prisma, { name: seed.name, email: seed.email, password: hashed, role: seed.role })
  }

  // ── Dealers ──────────────────────────────────────────────────────────────────
  // dealer1 gets a real login (Panel 1 demo account) — dealer2 is left with no
  // password, demonstrating that a dealer with none set simply can't sign in yet
  // (see Dealer.password's doc comment).
  let dealer1 = await prisma.dealer.findUnique({ where: { dealerCode: 'CBEDEAL' } })
  if (!dealer1) {
    dealer1 = await prisma.dealer.create({
      data: {
        name: 'Coimbatore Alliance Partners', email: 'dealer1@vivahaaelite.demo', dealerCode: 'CBEDEAL',
        city: 'Coimbatore', phone: '9840011111', commissionPct: 8, verified: true,
        password: await bcrypt.hash('Dealer@123', 12),
      },
    })
  } else if (!dealer1.password) {
    dealer1 = await prisma.dealer.update({ where: { id: dealer1.id }, data: { password: await bcrypt.hash('Dealer@123', 12) } })
  }
  let dealer2 = await prisma.dealer.findUnique({ where: { dealerCode: 'SLMDEAL' } })
  if (!dealer2) {
    dealer2 = await prisma.dealer.create({
      data: { name: 'Salem Matrimony Associates', email: 'dealer2@vivahaaelite.demo', dealerCode: 'SLMDEAL', city: 'Salem', phone: '9840022222', commissionPct: 10 },
    })
  }

  // ── Vendors across categories (V001PH already seeded by seed.js) ────────────
  // Panel 2 needs at least one seeded vendor per of the 6 category-dashboard
  // families (server/lib/vendorCategoryFields.js) — dj1/iyer1 added purely so the
  // category-specific field schema can be checked live for every family, even
  // though they carry no booking history of their own.
  const vendorSeeds = [
    { email: 'venue1@vivahaaelite.demo', name: 'Grand Regal Venue', category: 'Venue', city: 'Coimbatore', tier: 'elite' },
    { email: 'catering1@vivahaaelite.demo', name: 'Royal Feast Caterers', category: 'Catering', city: 'Tirupur', tier: 'standard' },
    { email: 'makeup1@vivahaaelite.demo', name: 'Glow Bridal Makeup', category: 'Makeup', city: 'Coimbatore', tier: 'elite' },
    { email: 'decor1@vivahaaelite.demo', name: 'Elegant Decor Co', category: 'Decor', city: 'Erode', tier: 'standard' },
    { email: 'dj1@vivahaaelite.demo', name: 'Beats & Baraat DJ', category: 'DJ', city: 'Coimbatore', tier: 'standard' },
    { email: 'iyer1@vivahaaelite.demo', name: 'Sri Ganapathy Iyer Services', category: 'Iyer/Purohit', city: 'Salem', tier: 'standard' },
  ]
  const vendors = {}
  for (const seed of vendorSeeds) {
    let vendor = await prisma.vendor.findUnique({ where: { email: seed.email } })
    if (!vendor) {
      const hashed = await bcrypt.hash('Vendor@123', 12)
      vendor = await createVendorWithId(prisma, {
        name: seed.name, category: seed.category, email: seed.email, password: hashed,
        city: seed.city, tier: seed.tier, price: '₹25,000 onwards', commissionPct: 10,
      })
    }
    vendors[seed.category] = vendor
  }
  const photographyVendor = await prisma.vendor.findUnique({ where: { email: 'vendor@vivahaaelite.demo' } })
  if (photographyVendor) vendors['Photography'] = photographyVendor

  // ── Members: a few dealer-registered, a few self-registered ─────────────────
  // arjun/divya (Standard) and ravi/shalini (Elite) double as Panel 3's 4 demo
  // logins — Male/Female on each tier — rather than adding 4 more accounts, since
  // these already carry real engagement data (arjun<->divya and karthik<->meena are
  // mutual Matches below; ravi->shalini is a one-directional Like, not yet mutual —
  // useful for demoing "liked but chat still locked"). Horoscope/lifestyle/income
  // fields are filled in so Elite's advanced filters and the AI best-match section
  // have real data to score, not empty fields.
  const memberSeeds = [
    { email: 'arjun@vivahaaelite.demo', name: 'Arjun Kumar', gender: 'Male', city: 'Coimbatore', religion: 'Hindu', caste: 'Gounder', plan: 'GOLD', dealerId: dealer1.id,
      nakshatra: 'Ashwini', rashi: 'Mesha', education: 'B.E. Mechanical', occupation: 'Software Engineer', foodPreference: 'Vegetarian',
      hobbies: 'Cricket, Reading', lifestyleInterests: 'Fitness, Travel', familyType: 'Nuclear', income: '₹15 LPA', incomeBracket: '10-20 LPA',
      partnerReligion: 'Hindu', partnerLocation: 'Coimbatore' },
    { email: 'divya@vivahaaelite.demo', name: 'Divya Rajan', gender: 'Female', city: 'Coimbatore', religion: 'Hindu', caste: 'Gounder', plan: 'GOLD', dealerId: dealer1.id,
      nakshatra: 'Rohini', rashi: 'Vrishabha', education: 'M.Sc Computer Science', occupation: 'Data Analyst', foodPreference: 'Vegetarian',
      hobbies: 'Painting, Music', lifestyleInterests: 'Yoga, Travel', familyType: 'Nuclear', income: '₹12 LPA', incomeBracket: '10-20 LPA',
      partnerReligion: 'Hindu', partnerLocation: 'Coimbatore' },
    { email: 'karthik@vivahaaelite.demo', name: 'Karthik Selvam', gender: 'Male', city: 'Salem', religion: 'Hindu', caste: 'Naidu', plan: 'DIAMOND', dealerId: dealer2.id,
      nakshatra: 'Mrigashira', rashi: 'Mithuna', education: 'B.Com', occupation: 'Bank Manager', foodPreference: 'Non-Vegetarian',
      hobbies: 'Chess', lifestyleInterests: 'Cricket, Movies', familyType: 'Joint', income: '₹9 LPA', incomeBracket: '5-10 LPA' },
    { email: 'meena@vivahaaelite.demo', name: 'Meena Sundaram', gender: 'Female', city: 'Salem', religion: 'Hindu', caste: 'Naidu', plan: 'SILVER', dealerId: dealer2.id,
      nakshatra: 'Bharani', rashi: 'Mesha', education: 'B.A. English', occupation: 'School Teacher', foodPreference: 'Vegetarian',
      hobbies: 'Dance', lifestyleInterests: 'Reading', familyType: 'Joint', income: '₹4.5 LPA', incomeBracket: 'Below 5 LPA' },
    { email: 'ravi@vivahaaelite.demo', name: 'Ravi Prakash', gender: 'Male', city: 'Tirupur', religion: 'Christian', plan: 'PLATINUM', dealerId: null,
      nakshatra: 'Hasta', rashi: 'Kanya', education: 'MBA Finance', occupation: 'Investment Banker', foodPreference: 'Non-Vegetarian',
      hobbies: 'Golf, Wine tasting', lifestyleInterests: 'Luxury travel, Art collecting', familyType: 'Joint family, established business background',
      income: '₹80 LPA', incomeBracket: '50 LPA+', partnerReligion: 'Christian', partnerLocation: 'Tirupur' },
    { email: 'shalini@vivahaaelite.demo', name: 'Shalini Iyer', gender: 'Female', city: 'Tirupur', religion: 'Christian', plan: 'PLATINUM', dealerId: null,
      nakshatra: 'Hasta', rashi: 'Kanya', education: 'MD Physician', occupation: 'Doctor', foodPreference: 'Non-Vegetarian',
      hobbies: 'Classical dance, Photography', lifestyleInterests: 'Luxury travel, Philanthropy', familyType: 'Joint family, business background',
      income: '₹60 LPA', incomeBracket: '50 LPA+', partnerReligion: 'Christian', partnerLocation: 'Tirupur' },
  ]
  const members = {}
  for (const seed of memberSeeds) {
    let user = await prisma.user.findUnique({ where: { email: seed.email } })
    const richFields = {
      nakshatra: seed.nakshatra, rashi: seed.rashi, education: seed.education, occupation: seed.occupation,
      foodPreference: seed.foodPreference, hobbies: seed.hobbies, lifestyleInterests: seed.lifestyleInterests,
      familyType: seed.familyType, income: seed.income, incomeBracket: seed.incomeBracket,
      partnerReligion: seed.partnerReligion, partnerLocation: seed.partnerLocation,
    }
    if (!user) {
      const hashed = await bcrypt.hash('Member@123', 12)
      user = await prisma.user.create({
        data: {
          email: seed.email, password: hashed, name: seed.name, gender: seed.gender, city: seed.city,
          religion: seed.religion, caste: seed.caste, plan: seed.plan, tier: isElitePlanTier(seed.plan) ? 'elite' : 'standard',
          dealerId: seed.dealerId, approved: true, emailVerified: true, profileCompletion: 80,
          ...richFields,
        },
      })
    } else if (!user.nakshatra) {
      // Backfills the horoscope/lifestyle/income fields onto members created by an
      // earlier run of this seed script, before those fields existed here.
      user = await prisma.user.update({
        where: { id: user.id },
        data: { tier: isElitePlanTier(seed.plan) ? 'elite' : 'standard', ...richFields },
      })
    }
    members[seed.email] = user
  }
  const [arjun, divya, karthik, meena, ravi, shalini] = memberSeeds.map((s) => members[s.email])

  // ── Engagement signal: profile views + likes (mutual pairs become Matches) ──
  const ensureView = (viewerId, viewedUserId) =>
    prisma.profileView.upsert({
      where: { id: `seed-${viewerId}-${viewedUserId}` }, update: {},
      create: { id: `seed-${viewerId}-${viewedUserId}`, viewerId, viewedUserId },
    })

  const ensureLike = async (fromUserId, toUserId) => {
    const exists = await prisma.like.findUnique({ where: { fromUserId_toUserId: { fromUserId, toUserId } } })
    if (!exists) await prisma.like.create({ data: { fromUserId, toUserId } })
  }
  const ensureMatch = async (userA, userB) => {
    const [a, b] = [userA.id, userB.id].sort()
    const exists = await prisma.match.findUnique({ where: { userAId_userBId: { userAId: a, userBId: b } } })
    if (!exists) await prisma.match.create({ data: { userAId: a, userBId: b } })
  }

  await Promise.all([
    ensureView(arjun.id, divya.id), ensureView(karthik.id, meena.id), ensureView(ravi.id, shalini.id),
    ensureView(divya.id, arjun.id), ensureView(meena.id, karthik.id),
  ])
  await ensureLike(arjun.id, divya.id)
  await ensureLike(divya.id, arjun.id)
  await ensureMatch(arjun, divya)

  await ensureLike(karthik.id, meena.id)
  await ensureLike(meena.id, karthik.id)
  await ensureMatch(karthik, meena)

  await ensureLike(ravi.id, shalini.id) // one-directional — not yet a match, just engagement signal

  // ── Post-match vendor bookings (only for matched pairs: arjun/divya, karthik/meena) ──
  const findOrCreateBooking = async (data) => {
    const exists = await prisma.booking.findFirst({ where: { userId: data.userId, vendorId: data.vendorId, serviceType: data.serviceType } })
    if (exists) return exists
    return prisma.booking.create({ data })
  }

  const b1 = await findOrCreateBooking({ userId: arjun.id, vendorId: vendors['Venue'].id, serviceType: 'Venue', status: 'COMPLETED', scheduledDate: new Date('2026-08-15') })
  const b2 = await findOrCreateBooking({ userId: arjun.id, vendorId: vendors['Catering'].id, serviceType: 'Catering', status: 'CONFIRMED', scheduledDate: new Date('2026-10-20') })
  const b3 = await findOrCreateBooking({ userId: karthik.id, vendorId: vendors['Makeup'].id, serviceType: 'Makeup', status: 'CANCELLED', cancelledBy: 'USER', cancelReason: 'Rescheduled the wedding date' })
  const b4 = await findOrCreateBooking({ userId: karthik.id, vendorId: vendors['Decor'].id, serviceType: 'Decor', status: 'CANCELLED', cancelledBy: 'VENDOR', cancelReason: 'Double-booked on that date' })
  const b5 = await findOrCreateBooking({ userId: meena.id, vendorId: vendors['Photography'].id, serviceType: 'Photography', status: 'COMPLETED', scheduledDate: new Date('2026-07-01') })
  // Extra Catering bookings so the demo vendor login (catering1) exercises every
  // order-status bucket in one place, not just Ongoing + Under Valuation.
  const b6 = await findOrCreateBooking({ userId: shalini.id, vendorId: vendors['Catering'].id, serviceType: 'Catering', status: 'COMPLETED', scheduledDate: new Date('2026-06-10') })
  const b7 = await findOrCreateBooking({ userId: divya.id, vendorId: vendors['Catering'].id, serviceType: 'Catering', status: 'CANCELLED', cancelledBy: 'VENDOR', cancelReason: 'Fully booked on that date' })

  // Category-specific details (Task 2.3's headcount/menu example for Catering) —
  // set unconditionally so re-seeding an already-created booking still backfills it.
  await prisma.booking.update({ where: { id: b2.id }, data: { details: { headcount: 350, menu: 'South Indian vegetarian' } } })
  await prisma.booking.update({ where: { id: b6.id }, data: { details: { headcount: 220, menu: 'North & South Indian multi-cuisine' } } })

  // ── Ratings for completed bookings ──────────────────────────────────────────
  const ensureRating = async (bookingId, vendorId, userId, rating, review) => {
    const exists = await prisma.vendorRating.findUnique({ where: { bookingId } })
    if (!exists) await prisma.vendorRating.create({ data: { bookingId, vendorId, userId, rating, review } })
  }
  await ensureRating(b1.id, vendors['Venue'].id, arjun.id, 5, 'Beautiful venue, excellent service.')
  await ensureRating(b5.id, vendors['Photography'].id, meena.id, 4, 'Great photos, slightly late to arrive.')
  await ensureRating(b6.id, vendors['Catering'].id, shalini.id, 5, 'Food was outstanding, guests loved it.')

  // ── Payments: membership (with dealer attribution where applicable) + vendor booking ──
  const findOrCreatePayment = async (where, data) => {
    const exists = await prisma.payment.findFirst({ where })
    if (exists) return exists
    return prisma.payment.create({ data })
  }
  await findOrCreatePayment(
    { userId: arjun.id, type: 'MEMBERSHIP' },
    { userId: arjun.id, dealerId: dealer1.id, amount: 2999, method: 'UPI', status: 'SUCCESS', type: 'MEMBERSHIP', tierAtPayment: 'GOLD' }
  )
  await findOrCreatePayment(
    { userId: divya.id, type: 'MEMBERSHIP' },
    { userId: divya.id, dealerId: dealer1.id, amount: 2999, method: 'CARD', status: 'SUCCESS', type: 'MEMBERSHIP', tierAtPayment: 'GOLD' }
  )
  await findOrCreatePayment(
    { userId: karthik.id, type: 'MEMBERSHIP' },
    { userId: karthik.id, dealerId: dealer2.id, amount: 5999, method: 'NETBANKING', status: 'SUCCESS', type: 'MEMBERSHIP', tierAtPayment: 'DIAMOND' }
  )
  await findOrCreatePayment(
    { userId: meena.id, type: 'MEMBERSHIP' },
    { userId: meena.id, dealerId: dealer2.id, amount: 499, method: 'UPI', status: 'FAILED', type: 'MEMBERSHIP', tierAtPayment: 'SILVER' }
  )
  await findOrCreatePayment(
    { userId: ravi.id, type: 'MEMBERSHIP' },
    { userId: ravi.id, amount: 9999, method: 'CARD', status: 'SUCCESS', type: 'MEMBERSHIP', tierAtPayment: 'PLATINUM' }
  )
  await findOrCreatePayment(
    { userId: shalini.id, type: 'MEMBERSHIP' },
    { userId: shalini.id, amount: 9999, method: 'WALLET', status: 'REFUNDED', type: 'MEMBERSHIP', tierAtPayment: 'PLATINUM' }
  )
  await findOrCreatePayment(
    { bookingId: b1.id },
    { userId: arjun.id, vendorId: vendors['Venue'].id, dealerId: dealer1.id, bookingId: b1.id, amount: 45000, method: 'NETBANKING', status: 'SUCCESS', type: 'VENDOR_BOOKING' }
  )
  await findOrCreatePayment(
    { bookingId: b5.id },
    { userId: meena.id, vendorId: vendors['Photography'].id, dealerId: dealer2.id, bookingId: b5.id, amount: 18000, method: 'UPI', status: 'SUCCESS', type: 'VENDOR_BOOKING' }
  )
  await findOrCreatePayment(
    { bookingId: b6.id },
    { userId: shalini.id, vendorId: vendors['Catering'].id, bookingId: b6.id, amount: 62000, method: 'CARD', status: 'SUCCESS', type: 'VENDOR_BOOKING' }
  )

  // ── Enquiries funnel: some converted, some open/closed, general + vendor-directed ──
  const findOrCreateEnquiry = async (where, data) => {
    const exists = await prisma.enquiry.findFirst({ where })
    if (exists) return exists
    return prisma.enquiry.create({ data })
  }
  await findOrCreateEnquiry({ userId: arjun.id, vendorId: vendors['Venue'].id }, { userId: arjun.id, vendorId: vendors['Venue'].id, message: 'Available for a Nov wedding?', status: 'CONVERTED' })
  await findOrCreateEnquiry({ userId: karthik.id, vendorId: vendors['Makeup'].id }, { userId: karthik.id, vendorId: vendors['Makeup'].id, message: 'Bridal package pricing?', status: 'CONVERTED' })
  await findOrCreateEnquiry({ userId: ravi.id, vendorId: null }, { userId: ravi.id, message: 'How does the Elite plan differ from Platinum?', status: 'CLOSED' })
  await findOrCreateEnquiry({ userId: shalini.id, vendorId: vendors['Catering'].id }, { userId: shalini.id, vendorId: vendors['Catering'].id, message: 'Vegetarian menu options?', status: 'OPEN' })
  await findOrCreateEnquiry({ userId: meena.id, vendorId: null }, { userId: meena.id, message: 'Requesting a refund on a failed payment.', status: 'OPEN' })

  // ── One open dealer edit request, one open vendor complaint ────────────────
  const editReqExists = await prisma.dealerEditRequest.findFirst({ where: { dealerId: dealer2.id, targetUserId: meena.id } })
  if (!editReqExists) {
    await prisma.dealerEditRequest.create({
      data: { dealerId: dealer2.id, targetUserId: meena.id, description: 'Member\'s city was mistyped as "Salam" instead of "Salem" during registration — please correct.' },
    })
  }
  const complaintExists = await prisma.vendorComplaint.findFirst({ where: { vendorId: vendors['Decor'].id, userId: karthik.id } })
  if (!complaintExists) {
    await prisma.vendorComplaint.create({
      data: { vendorId: vendors['Decor'].id, userId: karthik.id, description: 'Vendor did not respond to enquiry for 5 days before the booking was cancelled.' },
    })
  }

  console.log('Admin-panel demo data seeded (employees, dealers, vendors, members, payments, bookings, ratings, enquiries)')
}

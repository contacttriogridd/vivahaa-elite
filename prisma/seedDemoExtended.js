// Extended demo/prototype dataset for client walkthroughs (post Panel 1-3 build).
// Purely volume/realism — no new schema, no new routes, no new logic. Everything
// here is fictitious Tamil-Nadu-context data for the platform's existing service
// area (Coimbatore/Tirupur/Erode/Namakkal/Salem/Dindigul, per the site footer).
//
// Idempotent the same way every other seed file in this project is: every create
// is guarded by a find-by-natural-key check first (email for people, a booking
// count threshold per vendor for bookings), so re-running this against an
// already-seeded database tops up rather than duplicates. Deliberately NOT wired
// into `npm run db:seed` / vercel-build — this is a large, one-off "make the demo
// look lived-in" pass, not something every fresh dev setup or deploy should pay for.
// Run explicitly via `npm run db:seed:extended`.
import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { createEmployeeWithId } from '../server/lib/employeeId.js'
import { createVendorWithId } from '../server/lib/vendorId.js'
import { isElitePlanTier } from '../server/lib/plans.js'
import { INCOME_BRACKETS } from '../src/data/incomeBrackets.js'

// ── Fictitious name / detail pools ──────────────────────────────────────────────
const CITIES = ['Coimbatore', 'Tirupur', 'Erode', 'Namakkal', 'Salem', 'Dindigul']

const MALE_NAMES = [
  'Arun Prakash', 'Bala Murugan', 'Chandru Raja', 'Dinesh Kumar', 'Elango Sundaram',
  'Ganesh Babu', 'Hari Krishnan', 'Iniyan Vel', 'Jeeva Nandham', 'Karthik Raja',
  'Lokesh Waran', 'Manikandan S', 'Naveen Raj', 'Ovi Selvam', 'Pradeep Kumar',
  'Rajesh Kannan', 'Saravanan M', 'Thiru Murugan', 'Udhaya Kumar', 'Vignesh Aravind',
  'Yogesh Prabhu', 'Ashwin Vel', 'Boopathy R', 'Charan Kumar', 'Deva Raj',
]
const FEMALE_NAMES = [
  'Abirami Suresh', 'Bhuvana Priya', 'Chitra Devi', 'Deepika Ramesh', 'Elakkiya Karthik',
  'Farhana Begum', 'Gayathri Mohan', 'Hema Latha', 'Indhu Priya', 'Janani Shree',
  'Kavya Lakshmi', 'Lavanya Ravi', 'Meenakshi Sundari', 'Nithya Kalyani', 'Oviya Sri',
  'Priya Dharshini', 'Radhika Menon', 'Shalini Raj', 'Tamil Selvi', 'Uma Maheswari',
  'Vidhya Sagar', 'Yamuna Devi', 'Anjali Krishnan', 'Bhavani Shankar', 'Divya Bharathi',
]
const RELIGION_CASTE = [
  { religion: 'Hindu', caste: 'Gounder' }, { religion: 'Hindu', caste: 'Naidu' },
  { religion: 'Hindu', caste: 'Chettiar' }, { religion: 'Hindu', caste: 'Mudaliar' },
  { religion: 'Hindu', caste: 'Vanniyar' }, { religion: 'Hindu', caste: 'Nadar' },
  { religion: 'Christian', caste: null }, { religion: 'Muslim', caste: null },
]
const EDUCATIONS = [
  'B.E. Computer Science', 'B.Tech Mechanical', 'MBA Finance', 'M.Sc Mathematics', 'B.Com',
  'MBBS', 'B.A. English Literature', 'Diploma in Textile Technology', 'M.Tech Electronics',
  'CA (Chartered Accountant)', 'B.Sc Nursing', 'LLB',
]
const OCCUPATIONS = [
  'Software Engineer', 'Textile Business Owner', 'Bank Manager', 'Doctor', 'School Teacher',
  'Civil Engineer', 'Chartered Accountant', 'Government Employee', 'Interior Designer',
  'Entrepreneur', 'College Professor', 'Advocate',
]
const HOBBIES = [
  'Cricket, Reading', 'Classical dance, Music', 'Cooking, Travel', 'Chess, Photography',
  'Yoga, Painting', 'Badminton, Movies', 'Gardening, Devotional music', 'Trekking, Cycling',
  'Carnatic music, Reading', 'Football, Cooking',
]
const LIFESTYLE = [
  'Fitness enthusiast, loves travel', 'Prefers a quiet family-oriented lifestyle',
  'Active socially, enjoys weekend getaways', 'Health-conscious, practices yoga daily',
  'Enjoys classical arts and cultural events', 'Loves outdoor adventures and trekking',
]
const FAMILY_TYPES = [
  'Nuclear family', 'Joint family', 'Nuclear family, close-knit', 'Joint family, business background',
  'Nuclear family, parents settled abroad', 'Joint family, agricultural background',
]
// Same 27-nakshatra / 12-rashi lists as src/lib/horoscope.ts, inlined here since this
// script runs as plain Node and can't cross into TypeScript source (see
// server/lib/vendorId.js's own comment for why that breaks elsewhere in this project).
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya',
  'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
  'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
  'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]
const RASIS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Kataka', 'Simha', 'Kanya', 'Tula', 'Vrischika',
  'Dhanus', 'Makara', 'Kumbha', 'Meena',
]
const CANCEL_REASONS = [
  'Rescheduled the wedding date', 'Found a package that better fit the budget',
  'Double-booked on that date', 'Family preferred a different vendor',
  'Venue changed, no longer compatible', 'Unable to confirm final guest count in time',
]
const RATING_REVIEWS = {
  5: ['Excellent service, exceeded expectations.', 'Wonderful experience, highly recommend.', 'Everything was perfect on the day.'],
  4: ['Great service overall, minor delays.', 'Very good, would book again.', 'Professional and courteous team.'],
  3: ['Decent service, met basic expectations.', 'Average experience, some coordination issues.'],
  2: ['Below expectations — arrived late and setup was rushed. Communication could improve significantly.'],
}

const pick = (arr, i) => arr[i % arr.length]
const dealerCode = (city, n) => `${city.slice(0, 3).toUpperCase()}DL${n}`

// ── Vendor category definitions (mirrors server/lib/vendorCategoryFields.js's
// families, using the platform's real category strings from src/data/vendorCategories.js) ──
const VENDOR_CATEGORY_PLAN = [
  { category: 'Catering', namePool: ['Sri Annapoorna Caterers', 'Grand Feast Catering', 'Thangam Catering Co', 'Muruga Bhavan Catering', 'Palate Royale Caterers'], count: 3, startAt: 2 },
  { category: 'Photography', namePool: ['Kalakshetra Photography', 'Momentz Wedding Studio', 'Shutter Tales Studio', 'Prisma Frames Photography', 'Divya Clicks Photography'], count: 3, startAt: 2 },
  { category: 'Venue', namePool: ['Sri Lakshmi Mahal', 'Green Meadows Convention Centre', 'Sangam Mahal', 'Royal Palace Marriage Hall'], count: 3, startAt: 2 },
  { category: 'Decor', namePool: ['Sparkle Events & Decor', 'Royal Touch Decorations', 'Dream Weddings Decor'], count: 2, startAt: 2 },
  { category: 'Florist', namePool: ['Petal Paradise Florists', 'Fresh Bloom Flower Boutique', 'Malligai Flower Arrangements'], count: 3, startAt: 1 },
  { category: 'DJ', namePool: ['SoundWave Events DJ', 'Rhythm Nation DJ Services', 'DJ Vibe Entertainment'], count: 3, startAt: 2 },
  { category: 'Iyer/Purohit', namePool: ['Sri Sankara Iyer Poojas', 'Vedic Purohit Services'], count: 2, startAt: 2 },
  { category: 'Nadhaswaram-Vaathiyam', namePool: ['Nadha Sudha Nadaswaram Troupe', 'Mangala Vadyam Artists', 'Sri Thyagaraja Nadaswaram Group'], count: 3, startAt: 1 },
]

const CATEGORY_SLUG = {
  Catering: 'catering', Photography: 'photography', Venue: 'venue', Decor: 'decor',
  Florist: 'florist', DJ: 'dj', 'Iyer/Purohit': 'iyer', 'Nadhaswaram-Vaathiyam': 'nadaswaram',
}

const CATEGORY_DETAILS = {
  Catering: (i) => ({ headcount: 150 + (i % 5) * 50, menu: pick(['South Indian vegetarian', 'North & South multi-cuisine', 'Traditional Chettinad', 'Pure vegetarian Sattvic'], i) }),
  Photography: (i) => ({ hours: 6 + (i % 4) * 2, packageTier: pick(['Silver', 'Gold', 'Premium'], i) }),
  Venue: (i) => ({ capacity: 300 + (i % 5) * 100, hallType: pick(['AC Banquet Hall', 'Open-air Mahal', 'Convention Centre'], i) }),
  Decor: (i) => ({ theme: pick(['Floral & Fairy Lights', 'Royal Traditional', 'Minimalist Pastel'], i), flowerType: pick(['Rose & Marigold', 'Orchid', 'Jasmine & Rose'], i), areaSqft: 1000 + (i % 4) * 500 }),
  Florist: (i) => ({ theme: pick(['Floral & Fairy Lights', 'Traditional Garlands', 'Modern Bouquet Arch'], i), flowerType: pick(['Jasmine', 'Rose', 'Mixed Seasonal'], i), areaSqft: 500 + (i % 4) * 300 }),
  DJ: (i) => ({ eventDurationHours: 3 + (i % 4) }),
  'Iyer/Purohit': (i) => ({ ceremonyType: pick(['Wedding Muhurtham', 'Engagement', 'Griha Pravesham'], i), durationHours: 2 + (i % 3) }),
  'Nadhaswaram-Vaathiyam': (i) => ({ ceremonyType: pick(['Wedding Procession', 'Muhurtham', 'Reception'], i), durationHours: 2 + (i % 3) }),
}

export async function seedDemoExtended(prisma) {
  // ── Dealers: top up to 3 total (dealer1/dealer2 already exist from Panel 1) ──
  let dealer3 = await prisma.dealer.findUnique({ where: { dealerCode: 'ERDDEAL' } })
  if (!dealer3) {
    dealer3 = await prisma.dealer.create({
      data: { name: 'Erode Wedding Connect', email: 'dealer3@vivahaaelite.demo', dealerCode: 'ERDDEAL', city: 'Erode', phone: '9840033333', commissionPct: 9 },
    })
  }
  const dealer1 = await prisma.dealer.findUnique({ where: { dealerCode: 'CBEDEAL' } })
  const dealer2 = await prisma.dealer.findUnique({ where: { dealerCode: 'SLMDEAL' } })
  const dealers = [dealer1, dealer2, dealer3].filter(Boolean)

  // ── Vendors: 3-5 per category, on top of the ones seeded in seedAdminDemo.js ──
  const vendorsByCategory = {}
  for (const plan of VENDOR_CATEGORY_PLAN) {
    vendorsByCategory[plan.category] = vendorsByCategory[plan.category] || []
    for (let i = 0; i < plan.count; i++) {
      const n = plan.startAt + i
      const slug = CATEGORY_SLUG[plan.category]
      const email = `${slug}${n}@vivahaaelite.demo`
      let vendor = await prisma.vendor.findUnique({ where: { email } })
      if (!vendor) {
        const hashed = await bcrypt.hash('Vendor@123', 12)
        vendor = await createVendorWithId(prisma, {
          name: pick(plan.namePool, i), category: plan.category, email: email, password: hashed,
          city: pick(CITIES, n), tier: n % 3 === 0 ? 'elite' : 'standard',
          price: `₹${(15 + (n % 6) * 10)},000 onwards`, commissionPct: 8 + (n % 3) * 2,
          verified: n % 2 === 0,
        })
      }
      vendorsByCategory[plan.category].push(vendor)
    }
  }
  // Existing category vendors (seeded earlier) join the same pools so bookings/
  // ratings get distributed across the full set, not just the newly created ones.
  const existingByEmail = async (email, category) => {
    const v = await prisma.vendor.findUnique({ where: { email } })
    if (v) vendorsByCategory[category] = [v, ...(vendorsByCategory[category] || [])]
  }
  await existingByEmail('catering1@vivahaaelite.demo', 'Catering')
  await existingByEmail('vendor@vivahaaelite.demo', 'Photography')
  await existingByEmail('venue1@vivahaaelite.demo', 'Venue')
  await existingByEmail('decor1@vivahaaelite.demo', 'Decor')
  await existingByEmail('rbacflorist@vivahaaelite.demo', 'Florist')
  await existingByEmail('dj1@vivahaaelite.demo', 'DJ')
  await existingByEmail('iyer1@vivahaaelite.demo', 'Iyer/Purohit')

  const allVendors = Object.entries(vendorsByCategory).flatMap(([category, list]) => list.map((v) => ({ ...v, _category: category })))

  // ── Users: 20 per (tier x gender) = 80, varied and attributed to dealers ─────
  const TIER_PLANS = { standard: ['GOLD', 'DIAMOND', 'SILVER'], elite: ['PLATINUM', 'PLATINUM_PLUS'] }
  const USERS_PER_GROUP = 20
  const allNewUsers = []
  let globalIndex = 0

  for (const tier of ['standard', 'elite']) {
    for (const gender of ['Male', 'Female']) {
      const namePool = gender === 'Male' ? MALE_NAMES : FEMALE_NAMES
      for (let i = 0; i < USERS_PER_GROUP; i++) {
        globalIndex += 1
        const idx = globalIndex
        const slug = `${tier}${gender.toLowerCase()}${i + 1}`
        const email = `${slug}@vivahaaelite.demo`
        let user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
          const plan = pick(TIER_PLANS[tier], i)
          const rc = pick(RELIGION_CASTE, idx)
          // ~2/3 dealer-registered, 1/3 self-registered. Dealer choice must be keyed
          // off a DIFFERENT modulus than the has-dealer check below — both using
          // idx % 3 meant dealers[0] (dealer1) could only ever be picked on the same
          // remainders the has-dealer check excludes, so it mathematically never got
          // assigned a single new user. Caught by testing dealer1's onboarded-user
          // count live after the first seed run, not by code review.
          const hasDealer = idx % 3 !== 0
          const dealerAssign = hasDealer ? dealers[Math.floor(idx / 3) % dealers.length] : null
          const feePaid = idx % 4 !== 0 // 3/4 paid, 1/4 unpaid — for the dealer reminder demo
          const daysAgo = idx % 5 === 0 ? 9 : idx % 5 === 1 ? 6 : 0 // some 8+, some 5-7, most recent — inactivity reminder demo
          const lastActive = new Date(Date.now() - daysAgo * 86400000)
          const hashed = await bcrypt.hash('Member@123', 12)
          user = await prisma.user.create({
            data: {
              email, password: hashed, name: pick(namePool, i + globalIndex), gender, city: pick(CITIES, idx),
              religion: rc.religion, caste: rc.caste, plan, tier, dealerId: dealerAssign?.id ?? null,
              approved: true, emailVerified: true, profileCompletion: 75 + (idx % 4) * 5,
              feeStatus: feePaid ? 'paid' : 'pending', lastActiveAt: lastActive, lastLogin: lastActive,
              dob: `${1988 + (idx % 12)}-0${1 + (idx % 9)}-${10 + (idx % 18)}`,
              nakshatra: pick(NAKSHATRAS, idx), rashi: pick(RASIS, idx),
              education: pick(EDUCATIONS, idx), occupation: pick(OCCUPATIONS, idx),
              foodPreference: pick(['Vegetarian', 'Non-Vegetarian', 'Eggetarian'], idx),
              hobbies: pick(HOBBIES, idx), lifestyleInterests: pick(LIFESTYLE, idx),
              familyType: pick(FAMILY_TYPES, idx), income: `₹${4 + (idx % 12)} LPA`,
              incomeBracket: pick(INCOME_BRACKETS, idx),
              partnerReligion: rc.religion, partnerLocation: pick(CITIES, idx + 1),
              height: `${150 + (idx % 25)} cm`, motherTongue: 'Tamil',
            },
          })
        } else {
          // Backfill for users already created by an earlier, buggy run of this
          // script (see the note above dealerAssign) — corrects dealerId in place
          // without touching anything else already saved for them.
          const hasDealer = idx % 3 !== 0
          const correctDealer = hasDealer ? dealers[Math.floor(idx / 3) % dealers.length] : null
          const correctDealerId = correctDealer?.id ?? null
          if (user.dealerId !== correctDealerId) {
            user = await prisma.user.update({ where: { id: user.id }, data: { dealerId: correctDealerId } })
          }
        }
        allNewUsers.push({ ...user, _tier: tier, _gender: gender })
      }
    }
  }

  const byTierGender = (tier, gender) => allNewUsers.filter((u) => u._tier === tier && u._gender === gender)

  // ── Vendor bookings / ratings / payments, distributed unevenly on purpose ───
  const allBookableUsers = allNewUsers // any of the 80 can be a vendor's customer
  let userCursor = 0
  const nextUser = () => allBookableUsers[(userCursor++) % allBookableUsers.length]

  for (let vi = 0; vi < allVendors.length; vi++) {
    const vendor = allVendors[vi]
    const existingCount = await prisma.booking.count({ where: { vendorId: vendor.id } })
    // Busier vendors (every 3rd) get more of everything — deliberately uneven spread.
    const busy = vi % 3 === 0
    const targets = { completed: busy ? 4 : 1 + (vi % 2), ongoing: busy ? 2 : vi % 2, rejected: busy ? 2 : vi % 2, underValuation: 1 + (vi % 2) }
    const targetTotal = targets.completed + targets.ongoing + targets.rejected + targets.underValuation
    if (existingCount >= targetTotal) continue

    const detailFn = CATEGORY_DETAILS[vendor._category] || (() => undefined)
    let created = 0
    for (let k = 0; k < targets.completed; k++) {
      const user = nextUser()
      const booking = await prisma.booking.create({
        data: {
          userId: user.id, vendorId: vendor.id, serviceType: vendor._category, status: 'COMPLETED',
          scheduledDate: new Date(Date.now() - (30 + vi * 5 + k * 3) * 86400000), details: detailFn(vi + k),
        },
      })
      const amount = 15000 + ((vi * 7 + k * 3) % 12) * 5000
      await prisma.payment.create({
        data: { userId: user.id, vendorId: vendor.id, bookingId: booking.id, amount, method: pick(['UPI', 'CARD', 'NETBANKING'], vi + k), status: 'SUCCESS', type: 'VENDOR_BOOKING' },
      })
      // Mostly positive ratings, a few average, at least one low with constructive feedback.
      const rating = (vi + k) % 9 === 0 ? 2 : (vi + k) % 4 === 0 ? 3 : (vi + k) % 2 === 0 ? 5 : 4
      await prisma.vendorRating.create({
        data: { bookingId: booking.id, vendorId: vendor.id, userId: user.id, rating, review: pick(RATING_REVIEWS[rating], vi + k) },
      })
      created++
    }
    for (let k = 0; k < targets.ongoing; k++) {
      const user = nextUser()
      await prisma.booking.create({
        data: {
          userId: user.id, vendorId: vendor.id, serviceType: vendor._category,
          status: k % 2 === 0 ? 'CONFIRMED' : 'PENDING',
          scheduledDate: new Date(Date.now() + (15 + vi * 4 + k * 6) * 86400000), details: detailFn(vi + k + 1),
        },
      })
    }
    for (let k = 0; k < targets.rejected; k++) {
      const user = nextUser()
      await prisma.booking.create({
        data: {
          userId: user.id, vendorId: vendor.id, serviceType: vendor._category, status: 'CANCELLED',
          cancelledBy: k % 2 === 0 ? 'USER' : 'VENDOR', cancelReason: pick(CANCEL_REASONS, vi + k),
        },
      })
    }
    for (let k = 0; k < targets.underValuation; k++) {
      const user = nextUser()
      await prisma.enquiry.create({
        data: { userId: user.id, vendorId: vendor.id, status: 'OPEN', message: pick(['Available for a December wedding?', 'Can you share your package pricing?', 'Do you provide service outside your home city?', 'What is your advance booking policy?'], vi + k) },
      })
    }
  }

  // ── Engagement: profile views, likes (with guaranteed mutual pairs), passes ─
  const ensureView = async (viewerId, viewedUserId) => {
    const exists = await prisma.profileView.findFirst({ where: { viewerId, viewedUserId } })
    if (!exists) await prisma.profileView.create({ data: { viewerId, viewedUserId } })
  }
  const ensureLike = async (fromUserId, toUserId) => {
    await prisma.like.upsert({
      where: { fromUserId_toUserId: { fromUserId, toUserId } }, update: {},
      create: { fromUserId, toUserId },
    })
  }
  const ensureMatch = async (userAId, userBId) => {
    const [a, b] = [userAId, userBId].sort()
    return prisma.match.upsert({
      where: { userAId_userBId: { userAId: a, userBId: b } }, update: {},
      create: { userAId: a, userBId: b },
    })
  }
  const ensurePass = async (fromUserId, toUserId) => {
    await prisma.profilePass.upsert({
      where: { fromUserId_toUserId: { fromUserId, toUserId } }, update: {},
      create: { fromUserId, toUserId },
    })
  }
  const CHAT_OPENERS = [
    ['Hi! Nice to match with you.', 'Hello! Likewise, nice to meet you here.', 'How has your week been?', 'Pretty good, work has been busy but good. How about you?', 'Same here. Would love to know more about your family.'],
    ['Hello, thank you for accepting the match!', 'Of course, your profile stood out to me.', 'That is kind of you to say. What are you looking for in a partner?', 'Someone family-oriented and easy to talk to, like this conversation already :)', 'Haha, that is a great start then!'],
    ['Hi, how are you doing today?', 'I am doing well, thank you! And you?', 'Good, just finished work. I saw we share an interest in travel.', 'Yes! I would love to hear about places you have visited.', 'Let us plan a call sometime to talk more.'],
  ]

  for (const tier of ['standard', 'elite']) {
    for (const gender of ['Male', 'Female']) {
      const group = byTierGender(tier, gender)
      const oppositeGroup = byTierGender(tier, gender === 'Male' ? 'Female' : 'Male')
      for (let i = 0; i < group.length; i++) {
        const user = group[i]
        // Views: ~8 opposite-gender profiles each.
        for (let v = 0; v < 8; v++) {
          const target = oppositeGroup[(i + v) % oppositeGroup.length]
          if (target) await ensureView(user.id, target.id)
        }
        // Likes sent: ~6 each.
        for (let l = 0; l < 6; l++) {
          const target = oppositeGroup[(i + l * 3) % oppositeGroup.length]
          if (target) await ensureLike(user.id, target.id)
        }
        // Passes: 2-3 each.
        for (let p = 0; p < 3; p++) {
          const target = oppositeGroup[(i + p * 5 + 1) % oppositeGroup.length]
          if (target && target.id !== user.id) await ensurePass(user.id, target.id)
        }
      }
      // Guarantee 4 mutual pairs per tier (2 per gender direction, so 4 total per
      // tier once both gender loops have run — matches the "3-5 per tier" ask).
      for (let m = 0; m < 2; m++) {
        const a = group[m]
        const b = oppositeGroup[m]
        if (a && b) {
          await ensureLike(a.id, b.id)
          await ensureLike(b.id, a.id)
          const match = await ensureMatch(a.id, b.id)
          const existingMsgs = await prisma.message.count({ where: { matchId: match.id } })
          if (existingMsgs === 0) {
            const thread = pick(CHAT_OPENERS, m)
            for (let mi = 0; mi < thread.length; mi++) {
              await prisma.message.create({
                data: { matchId: match.id, senderId: mi % 2 === 0 ? a.id : b.id, body: thread[mi] },
              })
            }
          }
        }
      }
    }
  }

  // ── The 4 primary demo accounts get extra mutual matches + real chat history ──
  const primaryEmails = ['arjun@vivahaaelite.demo', 'divya@vivahaaelite.demo', 'ravi@vivahaaelite.demo', 'shalini@vivahaaelite.demo']
  const primaries = await prisma.user.findMany({ where: { email: { in: primaryEmails } } })
  for (const primary of primaries) {
    const tier = isElitePlanTier(primary.plan) ? 'elite' : 'standard'
    const oppositeGroup = byTierGender(tier, primary.gender === 'Male' ? 'Female' : 'Male')
    for (let m = 0; m < 3; m++) {
      const partner = oppositeGroup[(oppositeGroup.length - 1 - m) % oppositeGroup.length] // pick from the tail, away from the tier-pair block above
      if (!partner) continue
      await ensureLike(primary.id, partner.id)
      await ensureLike(partner.id, primary.id)
      const match = await ensureMatch(primary.id, partner.id)
      const existingMsgs = await prisma.message.count({ where: { matchId: match.id } })
      if (existingMsgs === 0) {
        const thread = pick(CHAT_OPENERS, m + 1)
        for (let mi = 0; mi < thread.length; mi++) {
          await prisma.message.create({
            data: { matchId: match.id, senderId: mi % 2 === 0 ? primary.id : partner.id, body: thread[mi] },
          })
        }
      }
    }
    // A handful of extra passed profiles for a fuller "Rejected Profiles" list.
    for (let p = 0; p < 3; p++) {
      const target = oppositeGroup[(p * 7 + 2) % oppositeGroup.length]
      if (target) await ensurePass(primary.id, target.id)
    }
    // A full "Profiles I Viewed" history — the tier/gender loop above only gave
    // background users a browsing history, not the 4 primaries themselves.
    for (let v = 0; v < 10; v++) {
      const target = oppositeGroup[(v * 3 + 5) % oppositeGroup.length]
      if (target) await ensureView(primary.id, target.id)
    }
    // Elite primaries also need a populated "who viewed me" list to demo that perk.
    if (tier === 'elite') {
      const sameGenderGroup = byTierGender(tier, primary.gender)
      for (let v = 0; v < 6; v++) {
        const viewer = oppositeGroup[(v * 5 + 1) % oppositeGroup.length] || sameGenderGroup[v % sameGenderGroup.length]
        if (viewer) await ensureView(viewer.id, primary.id)
      }
    }
  }

  // ── Employees: a 2nd per role, plus realistic audit-log history ─────────────
  const EXTRA_EMPLOYEES = [
    { email: 'hr2@vivahaaelite.demo', name: 'Kavitha Ramesh', role: 'HR_ADMIN' },
    { email: 'usermgr2@vivahaaelite.demo', name: 'Suresh Kumar', role: 'USER_MANAGEMENT' },
    { email: 'vendormgr2@vivahaaelite.demo', name: 'Priya Venkat', role: 'VENDOR_MANAGEMENT' },
    { email: 'dealermgr2@vivahaaelite.demo', name: 'Arul Selvan', role: 'DEALER_MANAGEMENT' },
  ]
  const employees = {}
  for (const seed of EXTRA_EMPLOYEES) {
    let employee = await prisma.employee.findUnique({ where: { email: seed.email } })
    if (!employee) {
      const hashed = await bcrypt.hash('Employee@123', 12)
      employee = await createEmployeeWithId(prisma, { name: seed.name, email: seed.email, password: hashed, role: seed.role })
    }
    employees[seed.role] = employee
  }
  const hr1 = await prisma.employee.findUnique({ where: { email: 'hr@vivahaaelite.demo' } })
  const usermgr1 = await prisma.employee.findUnique({ where: { email: 'usermgr@vivahaaelite.demo' } })
  const vendormgr1 = await prisma.employee.findUnique({ where: { email: 'vendormgr@vivahaaelite.demo' } })
  const dealermgr1 = await prisma.employee.findUnique({ where: { email: 'dealermgr@vivahaaelite.demo' } })

  const logIfAbsent = async (adminId, action, entity, entityId, details) => {
    const exists = await prisma.auditLog.findFirst({ where: { adminId, action, entityId } })
    if (!exists) await prisma.auditLog.create({ data: { adminId, action, entity, entityId, details, ip: '127.0.0.1' } })
  }

  // HR: created the 4 new employees.
  if (hr1) {
    for (const seed of EXTRA_EMPLOYEES) {
      const e = employees[seed.role]
      if (e) await logIfAbsent(hr1.id, 'create_employee', 'Employee', e.id, JSON.stringify({ name: seed.name, role: seed.role }))
    }
  }

  // User Management: a couple of curated-match sends + a priority-support touch.
  if (usermgr1 || employees.USER_MANAGEMENT) {
    const actor = employees.USER_MANAGEMENT || usermgr1
    const sample = allNewUsers.slice(0, 4)
    for (let i = 0; i < sample.length - 1; i += 2) {
      const user = sample[i]
      const target = sample[i + 1]
      await logIfAbsent(actor.id, 'engagement_match_suggestion', 'User', user.id, JSON.stringify({ targetUserId: target.id, note: "Our team found a profile we think you'll like." }))
      const notifExists = await prisma.notification.findFirst({ where: { userId: user.id, type: 'match_suggestion' } })
      if (!notifExists) {
        await prisma.notification.create({ data: { userId: user.id, title: 'A curated match for you', message: "Our team found a profile we think you'll like — check your matches.", type: 'match_suggestion' } })
      }
    }
  }

  // Vendor Management: log + resolve one complaint, plus an update_vendor entry.
  if (vendormgr1 || employees.VENDOR_MANAGEMENT) {
    const actor = employees.VENDOR_MANAGEMENT || vendormgr1
    const someVendor = allVendors[0]
    const someUser = allNewUsers[0]
    if (someVendor && someUser) {
      let complaint = await prisma.vendorComplaint.findFirst({ where: { vendorId: someVendor.id, userId: someUser.id } })
      if (!complaint) {
        complaint = await prisma.vendorComplaint.create({
          data: { vendorId: someVendor.id, userId: someUser.id, description: 'Vendor arrived later than the agreed setup time for a booked event.', status: 'open' },
        })
        await logIfAbsent(actor.id, 'log_vendor_complaint', 'VendorComplaint', complaint.id)
      }
      if (complaint.status === 'open') {
        await prisma.vendorComplaint.update({ where: { id: complaint.id }, data: { status: 'resolved', handledById: actor.id, resolvedAt: new Date() } })
        await logIfAbsent(actor.id, 'resolve_vendor_complaint', 'VendorComplaint', complaint.id, JSON.stringify({ resolution: 'Vendor issued an apology and a partial refund; member accepted.' }))
      }
      await logIfAbsent(actor.id, 'update_vendor', 'Vendor', someVendor.id, JSON.stringify({ verified: true }))
    }
  }

  // Dealer Management: log + resolve an edit request, plus an update_dealer entry.
  if (dealermgr1 || employees.DEALER_MANAGEMENT) {
    const actor = employees.DEALER_MANAGEMENT || dealermgr1
    const dealerUser = allNewUsers.find((u) => u.dealerId)
    if (dealerUser) {
      let req_ = await prisma.dealerEditRequest.findFirst({ where: { dealerId: dealerUser.dealerId, targetUserId: dealerUser.id } })
      if (!req_) {
        req_ = await prisma.dealerEditRequest.create({
          data: { dealerId: dealerUser.dealerId, targetUserId: dealerUser.id, description: "Member's city was misspelled during onboarding — please correct.", status: 'open' },
        })
        await logIfAbsent(actor.id, 'log_dealer_edit_request', 'DealerEditRequest', req_.id)
      }
      if (req_.status === 'open') {
        await prisma.dealerEditRequest.update({ where: { id: req_.id }, data: { status: 'resolved', resolvedById: actor.id, resolvedAt: new Date() } })
        await logIfAbsent(actor.id, 'resolve_dealer_edit_request', 'DealerEditRequest', req_.id)
      }
    }
    if (dealer3) await logIfAbsent(actor.id, 'update_dealer', 'Dealer', dealer3.id, JSON.stringify({ commissionPct: 9 }))
  }

  console.log(`Extended demo data seeded: ${allVendors.length} vendors, ${allNewUsers.length} users, ${dealers.length} dealers, ${Object.keys(employees).length} new employees.`)
  return {
    vendorCount: allVendors.length,
    userCount: allNewUsers.length,
    dealerCount: dealers.length,
    newEmployeeCount: Object.keys(employees).length,
  }
}

// CLI entrypoint (npm run db:seed:extended) — same pattern as prisma/seed.js.
// Requires the base seed (npm run db:seed) to already have run, since this tops up
// on top of dealer1/dealer2, catering1/vendor@/venue1/decor1/rbacflorist/dj1/iyer1,
// and arjun/divya/ravi/shalini.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const prisma = new PrismaClient()
  seedDemoExtended(prisma).catch((err) => { console.error(err); process.exitCode = 1 }).finally(() => prisma.$disconnect())
}

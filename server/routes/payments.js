// Membership checkout: creates a Razorpay order against a RegistrationDraft, and
// materializes the actual User (+ PrivateProfile + Parent + Sibling + ProfileDocument
// rows) only once Razorpay's webhook confirms the payment server-side. This is the
// only place a self-registered User gets created — never from the client's checkout
// callback, which is not trustworthy on its own (see RazorpayCheckout.tsx, which polls
// GET /api/registration/draft/:token/status instead of trusting its own handler).
import express from 'express'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { planByTier, isElitePlanTier } from '../lib/plans.js'
import { labelForReligion, labelForCaste, labelForSubcaste, labelForKulam } from '../lib/registrationValidation.js'
import { sendMail } from '../lib/mailer.js'
import { sendSms } from '../lib/sms.js'

let razorpayClient = null
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null
  if (!razorpayClient) {
    razorpayClient = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  }
  return razorpayClient
}

/** Razorpay's webhook payment.entity.method values, mapped onto our PaymentMethod enum. */
const RAZORPAY_METHOD_MAP = { card: 'CARD', upi: 'UPI', netbanking: 'NETBANKING', wallet: 'WALLET', emi: 'CARD' }

const otpCode = () => Math.floor(100000 + Math.random() * 900000).toString()

export function createPaymentsRouter(prisma) {
  const router = express.Router()

  // POST /api/payments/razorpay/order
  router.post('/razorpay/order', async (req, res) => {
    try {
      const { draftToken, planTier } = req.body || {}
      const plan = planByTier(planTier)
      if (!draftToken || !plan) return res.status(400).json({ message: 'draftToken and a valid planTier are required' })

      const draft = await prisma.registrationDraft.findUnique({ where: { draftToken } })
      if (!draft) return res.status(404).json({ message: 'Draft not found' })
      if (draft.status !== 'in_progress') return res.status(409).json({ message: 'This registration is no longer editable' })

      const razorpay = getRazorpay()
      if (!razorpay) {
        // Outside production this is recoverable — RazorpayCheckout.tsx offers a demo
        // completion path (POST /demo/complete below) instead of dead-ending here, so
        // the rest of the flow (webhook-equivalent account creation, redirect to
        // login) can still be exercised without real Razorpay keys.
        return res.status(503).json({
          message: 'Payments are not configured yet.',
          demoAvailable: process.env.NODE_ENV !== 'production',
        })
      }

      const amountPaise = Math.round(plan.price * 100)
      let order
      try {
        order = await razorpay.orders.create({
          amount: amountPaise,
          currency: 'INR',
          receipt: draft.id,
          notes: { draftId: draft.id, planTier: plan.planTier },
        })
      } catch {
        return res.status(502).json({ message: 'Unable to start payment right now. Please try again.' })
      }

      await prisma.registrationDraft.update({ where: { id: draft.id }, data: { selectedPlan: plan.planTier } })
      await prisma.payment.create({
        data: {
          draftId: draft.id,
          amount: plan.price,
          status: 'PENDING',
          type: 'MEMBERSHIP',
          tierAtPayment: plan.planTier,
          payerName: draft.payload?.fullName || null,
          payerEmail: draft.email || null,
          razorpayOrderId: order.id,
        },
      })

      res.json({
        orderId: order.id,
        amount: amountPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        name: 'Vivahaa Elite',
        description: `${plan.id} membership`,
      })
    } catch {
      res.status(500).json({ message: 'Server error' })
    }
  })

  // POST /api/payments/demo/complete — dev/staging only (404s outright in
  // production, same guard as /api/auth/demo-login). Lets the registration flow be
  // exercised end-to-end — including the account-creation step that normally only
  // the signature-verified webhook triggers — when no real Razorpay keys are set.
  // Goes through the exact same `handlePaymentCaptured` the real webhook uses, just
  // with a synthetic payment id/order id instead of one Razorpay issued.
  router.post('/demo/complete', async (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(404).json({ message: 'Not available in production' })
    try {
      const { draftToken, planTier } = req.body || {}
      const plan = planByTier(planTier)
      if (!draftToken || !plan) return res.status(400).json({ message: 'draftToken and a valid planTier are required' })

      const draft = await prisma.registrationDraft.findUnique({ where: { draftToken } })
      if (!draft) return res.status(404).json({ message: 'Draft not found' })
      if (draft.status !== 'in_progress') return res.status(409).json({ message: 'This registration is no longer editable' })

      await prisma.registrationDraft.update({ where: { id: draft.id }, data: { selectedPlan: plan.planTier } })

      const demoOrderId = `demo_order_${draft.id}`
      const payment = await prisma.payment.upsert({
        where: { razorpayOrderId: demoOrderId },
        create: {
          draftId: draft.id,
          amount: plan.price,
          status: 'PENDING',
          type: 'MEMBERSHIP',
          tierAtPayment: plan.planTier,
          payerName: draft.payload?.fullName || null,
          payerEmail: draft.email || null,
          razorpayOrderId: demoOrderId,
        },
        update: {},
      })

      await handlePaymentCaptured(prisma, { id: `demo_pay_${payment.id}`, order_id: demoOrderId, method: 'upi' })
      res.json({ ok: true })
    } catch (err) {
      console.error('[demo payment] failed', err)
      res.status(500).json({ message: 'Demo payment could not be completed' })
    }
  })

  // POST /api/payments/razorpay/webhook — must read the RAW body; server/index.js
  // captures it as req.rawBody via express.json()'s `verify` option specifically so the
  // HMAC below can be computed over the exact bytes Razorpay signed.
  router.post('/razorpay/webhook', async (req, res) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET
      const signature = req.headers['x-razorpay-signature']
      if (!secret || !signature || !req.rawBody) return res.status(400).json({ message: 'Invalid webhook request' })

      const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex')
      const valid =
        expected.length === String(signature).length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)))
      if (!valid) return res.status(400).json({ message: 'Signature mismatch' })

      const event = req.body?.event
      const paymentEntity = req.body?.payload?.payment?.entity
      if (!paymentEntity) return res.status(200).json({ received: true })

      if (event === 'payment.captured') {
        await handlePaymentCaptured(prisma, paymentEntity)
      } else if (event === 'payment.failed') {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: paymentEntity.order_id },
          data: { status: 'FAILED', razorpayPaymentId: paymentEntity.id },
        })
      }

      res.status(200).json({ received: true })
    } catch (err) {
      console.error('[razorpay webhook] failed to process event', err)
      // Still 200 — Razorpay retries on non-2xx, and a transient failure here should
      // not cause an ever-growing redelivery storm for an event we've partly handled.
      res.status(200).json({ received: true })
    }
  })

  return router
}

/**
 * Creates the real User + PrivateProfile + Parent + Sibling + ProfileDocument rows
 * from the draft, exactly once, then sends the "set your password" email/SMS. Mirrors
 * the transaction that used to live directly in POST /api/auth/register (see git
 * history) — the only difference is the source of the data (a confirmed draft instead
 * of a live request body) and that nothing here logs the member in.
 */
async function handlePaymentCaptured(prisma, paymentEntity) {
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: paymentEntity.order_id } })
  if (!payment) return
  if (payment.status === 'SUCCESS') return // already processed — Razorpay redelivers webhooks

  const method = RAZORPAY_METHOD_MAP[paymentEntity.method] || null

  if (!payment.draftId) {
    // A payment with no draft (shouldn't happen for MEMBERSHIP via this flow) — just
    // record success, nothing to materialize.
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS', method, razorpayPaymentId: paymentEntity.id },
    })
    return
  }

  const draft = await prisma.registrationDraft.findUnique({ where: { id: payment.draftId } })
  if (!draft || draft.status === 'paid') return

  const d = draft.payload || {}
  const geo = null // city->lat/lng lookup happens the same way as the legacy route; left null here, filled in by admin geocoding if needed later

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: draft.email || d.email,
        password: d.passwordHash || null,
        name: d.fullName,
        phone: d.mobile,
        gender: d.gender,
        dob: d.dob,

        religion: d.religion ? labelForReligion(d.religion) : null,
        caste: d.caste ? labelForCaste(d.religion, d.caste) : null,
        subcaste: d.subcaste ? labelForSubcaste(d.religion, d.caste || '', d.subcaste) : null,
        kulam: d.kulam ? labelForKulam(d.kulam) : null,
        religionId: d.religion || null,
        casteId: d.caste || null,
        subcasteId: d.subcaste || null,
        kulamId: d.kulam || null,

        motherTongue: d.motherTongue,
        familyType: d.familyType,
        education: d.qualification,
        occupation: d.occupation,
        income: d.income,
        city: d.location,
        latitude: geo?.lat ?? null,
        longitude: geo?.lng ?? null,

        height: d.height,
        weight: d.weight,
        bloodGroup: d.bloodGroup,
        complexion: d.complexion,
        disabilityStatus: d.disabilityStatus,
        foodPreference: d.foodPreference,
        hobbies: d.hobbies,
        lifestyleInterests: d.interests,
        languagesKnown: d.languages,
        languagePreference: d.languagePreference,

        partnerAgeRange: d.partnerAge,
        partnerReligion: d.partnerReligion,
        partnerLocation: d.partnerLocation,

        birthTime: d.birthTime,
        birthPlace: d.birthPlace,
        nakshatra: d.nakshatra,
        rashi: d.rasi,
        noHoroscopeChart: Boolean(d.noHoroscopeChart),

        avatar: typeof d.photoDataUrl === 'string' ? d.photoDataUrl : null,

        plan: draft.selectedPlan || 'GOLD',
        tier: isElitePlanTier(draft.selectedPlan) ? 'elite' : 'standard',
        feeStatus: 'paid',
        profileCompletion: 60,
      },
    })

    await tx.privateProfile.create({
      data: {
        userId: created.id,
        maritalStatus: d.maritalStatus,
        hasChildren: d.hasChildren === 'yes',
        divorceDecreeConfirmed: Boolean(d.divorceDecreeConfirmed),
        widowDeclarationConfirmed: Boolean(d.widowDeclarationConfirmed),
        spousePassedOn: d.spousePassedOn || null,
        totalAssetValue: d.totalAssetValue || null,
        children: {
          create: (d.children || []).map((child) => ({
            age: child.age || null,
            livesWithMember: child.livesWithMe || null,
          })),
        },
      },
    })

    const parents = [
      { role: 'father', ...(d.father || {}) },
      { role: 'mother', ...(d.mother || {}) },
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

    if ((d.siblings || []).length) {
      await tx.sibling.createMany({
        data: d.siblings.map((sibling) => ({
          userId: created.id,
          name: sibling.name || null,
          gender: sibling.gender || null,
          maritalStatus: sibling.maritalStatus || null,
        })),
      })
    }

    if (d.divorceDocumentName) {
      await tx.profileDocument.create({
        data: {
          userId: created.id,
          kind: 'divorce_decree',
          fileName: d.divorceDocumentName,
          storageKey: `pending-upload/${created.id}/${d.divorceDocumentName}`,
        },
      })
    }

    if (typeof d.photoDataUrl === 'string' && d.photoDataUrl) {
      // Stored inline as a data URL for now (see plan doc "Photo storage" decision) —
      // storageKey is the data URL itself rather than an object-store key until real
      // cloud storage (Vercel Blob/S3/Cloudinary) is wired up.
      await tx.profileDocument.create({
        data: { userId: created.id, kind: 'photo', fileName: 'profile-photo.webp', storageKey: d.photoDataUrl },
      })
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        method,
        userId: created.id,
        razorpayPaymentId: paymentEntity.id,
      },
    })

    await tx.registrationDraft.update({ where: { id: draft.id }, data: { status: 'paid' } })

    return created
  })

  await sendWelcomeCredentials(prisma, user)
}

async function sendWelcomeCredentials(prisma, user) {
  const code = otpCode()
  await prisma.oTP.create({
    data: { userId: user.id, code, type: 'password_reset', expiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
  })

  const loginUrl = process.env.FRONTEND_URL || 'https://vivahaaelite.com'
  await sendMail({
    to: user.email,
    subject: 'Welcome to Vivahaa Elite — set your password',
    html: `
      <p>Dear ${user.name || 'Member'},</p>
      <p>Your payment has been received and your Vivahaa Elite profile is live.</p>
      <p>To set your password, visit <a href="${loginUrl}">${loginUrl}</a>, choose "Forgot password", enter your email
      (${user.email}) and use this code: <strong>${code}</strong> (valid 24 hours).</p>
      <p>Welcome to the community.</p>
    `,
  })

  if (user.phone) {
    await sendSms({ mobile: user.phone, variables: { var: code } })
  }
}

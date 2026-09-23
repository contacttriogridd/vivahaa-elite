// Server-side draft persistence for the public registration wizard (Task: rebuild
// registration into 5 steps). The wizard never creates a User directly any more — it
// saves its in-progress answers here, keyed by an opaque draftToken the client keeps
// in localStorage, and a User only gets created once the Razorpay webhook confirms
// payment (see server/routes/payments.js). This is what makes "resume after a
// refresh" possible without a real account existing yet.
import express from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { validateStepPayload } from '../lib/registrationValidation.js'

const DRAFT_TTL_MS = 7 * 24 * 3600 * 1000

export function createRegistrationRouter(prisma) {
  const router = express.Router()

  // POST /api/registration/draft — `data` is the wizard's *entire* current form state
  // (not just the active step's fields) since several fields are read across step
  // boundaries (e.g. maritalStatus gates fields shown together with it, dob feeds the
  // review step, etc.) — flattening avoids reassembling a full picture from partial
  // step slices later. `step` names which step the form is currently on, purely so the
  // matching slice of registrationValidation.js's schemas runs against it.
  router.post('/draft', async (req, res) => {
    try {
      const { draftToken, step, data } = req.body || {}
      if (!step || typeof data !== 'object' || data === null) {
        return res.status(400).json({ message: 'step and data are required' })
      }

      const validation = validateStepPayload(step, data)
      if (!validation.ok) return res.status(400).json({ message: 'Invalid step data', errors: validation.errors })

      const existing = draftToken
        ? await prisma.registrationDraft.findUnique({ where: { draftToken } })
        : null

      if (existing && existing.status !== 'in_progress') {
        // A paid/expired draft is done — never let a stray autosave reopen or mutate it.
        return res.status(409).json({ message: 'This registration is no longer editable' })
      }

      // The password never lands in the draft as plaintext — hash it the moment it's
      // saved and keep only the hash, exactly like the live User.password column.
      const sanitized = { ...data }
      if (typeof sanitized.password === 'string' && sanitized.password) {
        sanitized.passwordHash = await bcrypt.hash(sanitized.password, 12)
      }
      delete sanitized.password
      delete sanitized.confirmPassword

      const mergedPayload = { ...(existing?.payload || {}), ...sanitized }
      const email = typeof sanitized.email === 'string' && sanitized.email ? sanitized.email : existing?.email

      const draft = existing
        ? await prisma.registrationDraft.update({
            where: { id: existing.id },
            data: { payload: mergedPayload, email, currentStep: req.body.currentStep ?? existing.currentStep },
          })
        : await prisma.registrationDraft.create({
            data: {
              draftToken: crypto.randomUUID(),
              payload: mergedPayload,
              email,
              currentStep: req.body.currentStep ?? 0,
              expiresAt: new Date(Date.now() + DRAFT_TTL_MS),
            },
          })

      res.json({ draftToken: draft.draftToken })
    } catch (err) {
      res.status(500).json({ message: 'Unable to save your progress right now' })
    }
  })

  // GET /api/registration/draft/:token — resume-on-refresh.
  router.get('/draft/:token', async (req, res) => {
    try {
      const draft = await prisma.registrationDraft.findUnique({ where: { draftToken: req.params.token } })
      if (!draft || draft.expiresAt < new Date()) return res.status(404).json({ message: 'Draft not found' })
      // The bcrypt hash never needs to leave the server — a resumed draft just asks
      // the member to re-enter their password rather than round-tripping it.
      const { passwordHash, ...payload } = draft.payload || {}
      res.json({ payload, currentStep: draft.currentStep, status: draft.status })
    } catch {
      res.status(500).json({ message: 'Server error' })
    }
  })

  // GET /api/registration/draft/:token/status — cheap poll target while the frontend
  // waits for the payment webhook to confirm (see RazorpayCheckout.tsx).
  router.get('/draft/:token/status', async (req, res) => {
    try {
      const draft = await prisma.registrationDraft.findUnique({
        where: { draftToken: req.params.token },
        select: { status: true },
      })
      if (!draft) return res.status(404).json({ message: 'Draft not found' })
      res.json({ status: draft.status })
    } catch {
      res.status(500).json({ message: 'Server error' })
    }
  })

  return router
}

/**
 * Server-side mirror of the registration wizard's per-step validation
 * (src/pages/register/registrationSchema.ts). The client already validates with Zod
 * before a step advances, but nothing stops a direct POST to /api/registration/draft
 * bypassing the UI, so every step is re-validated here before it's ever persisted.
 *
 * Kept intentionally looser than the client where the client is UX polish (e.g. exact
 * password complexity) rather than data integrity — this file only enforces what would
 * actually corrupt the draft or the eventual User/PrivateProfile rows.
 */
import { z } from 'zod'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TAXONOMY_DIR = join(__dirname, '..', '..', 'src', 'data', 'taxonomy')
const CASTE_TAXONOMY = JSON.parse(readFileSync(join(TAXONOMY_DIR, 'casteTaxonomy.json'), 'utf-8'))
const KONGU_KULAMS = JSON.parse(readFileSync(join(TAXONOMY_DIR, 'konguKulams.json'), 'utf-8'))
const TAXONOMY_VERIFIED = CASTE_TAXONOMY.meta?.verified === true

const findReligion = (religionId) => (CASTE_TAXONOMY.religions || []).find((r) => r.id === religionId)
const findCaste = (religionId, casteId) => findReligion(religionId)?.castes?.find((c) => c.id === casteId)

/**
 * Server-side mirror of src/lib/taxonomy.ts's label* helpers — used by the payment
 * webhook to resolve the ids the wizard actually stores (religion/caste/subcaste/kulam
 * are Combobox values, i.e. taxonomy ids) into the human-readable strings the User row
 * has always stored in those columns. Falls back to the raw id when a free-text /
 * unverified entry has no taxonomy match, same as the client does.
 */
export const labelForReligion = (religionId) => findReligion(religionId)?.label ?? religionId
export const labelForCaste = (religionId, casteId) => findCaste(religionId, casteId)?.label ?? casteId
export const labelForSubcaste = (religionId, casteId, subcasteId) =>
  findCaste(religionId, casteId)?.subcastes?.find((s) => s.id === subcasteId)?.label ?? subcasteId
export const labelForKulam = (kulamId) => {
  const kulam = (KONGU_KULAMS.kulams || []).find((k) => k.id === kulamId)
  if (!kulam) return kulamId
  return kulam.tamil ? `${kulam.name} (${kulam.tamil})` : kulam.name
}

/**
 * Single source of truth for the asset brackets, mirrored on the client at
 * src/pages/register/registrationSchema.ts's ASSET_VALUE_RANGES — keep both in sync.
 */
export const ASSET_VALUE_RANGES = [
  'Below ₹1 Cr',
  '₹1 Cr – ₹5 Cr',
  '₹5 Cr – ₹10 Cr',
  '₹10 Cr – ₹20 Cr',
  '₹20 Cr – ₹50 Cr',
  '₹50 Cr – ₹100 Cr',
  '₹100 Cr – ₹200 Cr',
  '₹200 Cr – ₹500 Cr',
  'Above ₹500 Cr',
]

const optionalText = z.string().trim().optional().or(z.literal(''))

/** Religion is checked strictly (the religion list itself is complete and stable).
 * Caste/subcaste are only checked strictly once the taxonomy file's `meta.verified`
 * flips true — until then the client's comboboxes accept free text, and the server
 * must accept the same free text rather than silently rejecting real user input. */
function communityIssues(data) {
  const issues = []
  const religions = CASTE_TAXONOMY.religions || []
  const religion = religions.find((r) => r.id === data.religion)
  if (data.religion && !religion) {
    issues.push({ path: ['religion'], message: 'Unknown religion' })
  }
  if (TAXONOMY_VERIFIED && religion && data.caste) {
    const caste = (religion.castes || []).find((c) => c.id === data.caste)
    if (!caste) issues.push({ path: ['caste'], message: 'Caste does not belong to the selected religion' })
    else if (data.subcaste) {
      const subcaste = (caste.subcastes || []).find((s) => s.id === data.subcaste)
      if (!subcaste) issues.push({ path: ['subcaste'], message: 'Subcaste does not belong to the selected caste' })
    }
  }
  return issues
}

const stepSchemas = {
  basicContact: z.object({
    fullName: z.string().trim().min(2, 'Name is required'),
    gender: z.string().trim().min(1, 'Select a gender'),
    dob: z.string().trim().min(1, 'Date of birth is required'),
    mobile: z.string().trim().min(10, 'Enter a valid mobile number'),
    email: z.string().trim().email('Enter a valid email'),
    // Only checked when present: a resumed draft's autosave omits it entirely (see
    // GET /draft/:token, which never returns the hash back to the client), and this
    // step must still validate successfully on those later re-saves.
    password: z.string().min(8, 'Use at least 8 characters').optional().or(z.literal('')),
    location: optionalText,
    maritalStatus: optionalText,
  }),

  communityBackground: z
    .object({
      religion: z.string().trim().min(1, 'Select a religion'),
      caste: optionalText,
      subcaste: optionalText,
      kulam: optionalText,
      motherTongue: optionalText,
      height: optionalText,
      weight: optionalText,
      complexion: optionalText,
      disabilityStatus: optionalText,
    })
    .superRefine((data, ctx) => {
      for (const issue of communityIssues(data)) ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue })
    }),

  educationCareerFamily: z.object({
    qualification: optionalText,
    occupation: optionalText,
    income: optionalText,
    location: optionalText,
    familyType: optionalText,
  }),

  assetsPhotosPartner: z.object({
    totalAssetValue: z.enum(ASSET_VALUE_RANGES).optional().or(z.literal('')),
    partnerAge: optionalText,
    partnerReligion: optionalText,
    partnerLocation: optionalText,
  }),
}

/**
 * Validates one step's slice of the draft payload. Returns `{ ok: true }` or
 * `{ ok: false, errors: [{ path, message }] }` — never throws, so route handlers can
 * respond with a clean 400 either way.
 */
export function validateStepPayload(step, data) {
  const schema = stepSchemas[step]
  if (!schema) return { ok: true } // unrecognised/optional steps (e.g. membershipPayment) aren't gated here
  const result = schema.safeParse(data || {})
  if (result.success) return { ok: true }
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  }
}

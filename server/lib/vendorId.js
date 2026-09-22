// Vendor ID scheme: V + 3-digit sequence + 2-letter service code, e.g. "V001CS".
//
// The sequence number is Vendor.sequenceNo, a Postgres autoincrement column — that
// gives us "never reused, even after delete" for free, without a separate counter
// table. It only becomes known once the row is actually inserted, so IDs are
// assigned in two steps inside one transaction (see createVendorWithId below):
// insert to obtain sequenceNo, then update vendorId onto that same row. No other
// query can observe the intermediate placeholder.
// Imported from the minimal categories file, not src/data.js — that file also
// pulls in src/lib/plans.ts (TypeScript, no build step), which crashes Vercel's
// serverless bundler at runtime (ERR_MODULE_NOT_FOUND). See
// src/data/vendorCategories.js's own comment for the full story.
import { VENDOR_CATS } from '../../src/data/vendorCategories.js'

// One clear, unique 2-letter code per category. Add a line here (and only here)
// when a new service category is introduced — SERVICE_CODES is validated against
// VENDOR_CATS below so a missing mapping fails fast instead of generating a bad id.
export const SERVICE_CODES = {
  'Invitation': 'IN',
  'Venue': 'VN',
  'Catering': 'CS',
  'Photography': 'PH',
  'Decor': 'DC',
  'Makeup': 'MU',
  'Honeymoon': 'HM',
  'Iyer/Purohit': 'PR',
  'Nadhaswaram-Vaathiyam': 'NV',
  'Hotel': 'HT',
  'Travel': 'TR',
  'Wedding Planner': 'WP',
  'DJ': 'DJ',
  'Car Rental': 'CR',
  'Florist': 'FL',
}

const missing = VENDOR_CATS.filter((cat) => !SERVICE_CODES[cat])
if (missing.length) {
  throw new Error(`server/lib/vendorId.js: no service code mapped for: ${missing.join(', ')}`)
}
const codes = Object.values(SERVICE_CODES)
const dupes = codes.filter((c, i) => codes.indexOf(c) !== i)
if (dupes.length) {
  throw new Error(`server/lib/vendorId.js: duplicate service codes: ${[...new Set(dupes)].join(', ')}`)
}

const SEQUENCE_DIGITS = 3
const MAX_SEQUENCE = 10 ** SEQUENCE_DIGITS - 1 // 999 — bump SEQUENCE_DIGITS to 4 well before this is hit

export function getServiceCode(category) {
  const code = SERVICE_CODES[category]
  if (!code) throw new Error(`Unknown vendor category "${category}" — add it to SERVICE_CODES first`)
  return code
}

export function formatVendorId(sequenceNo, serviceCode) {
  return `V${String(sequenceNo).padStart(SEQUENCE_DIGITS, '0')}${serviceCode}`
}

/**
 * Creates a Vendor row with its permanent vendorId assigned server-side.
 * `data` must not include sequenceNo/vendorId/serviceCode — those are derived here.
 */
export async function createVendorWithId(prisma, data) {
  const serviceCode = getServiceCode(data.category)
  return prisma.$transaction(async (tx) => {
    const created = await tx.vendor.create({
      data: { ...data, serviceCode, vendorId: `__pending_${Date.now()}_${Math.random()}` },
    })
    if (created.sequenceNo > MAX_SEQUENCE) {
      throw new Error(`Vendor sequence ${created.sequenceNo} exceeds ${SEQUENCE_DIGITS}-digit capacity — bump SEQUENCE_DIGITS`)
    }
    return tx.vendor.update({
      where: { id: created.id },
      data: { vendorId: formatVendorId(created.sequenceNo, serviceCode) },
    })
  })
}

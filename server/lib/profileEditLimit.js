// Monthly profile-edit cap (Panel 3.4). The brief asked for "3-5 changes per
// calendar month" and said to default to 5 if a single number has to be picked —
// this is that single number, as one named constant rather than a magic number
// scattered across routes/UI.
export const MONTHLY_EDIT_LIMIT = 5

/**
 * What counts as "one change": one PATCH /api/profile call that actually modifies
 * at least one field — regardless of how many fields it touches in that call. This
 * is deliberately generous to the member (batching five field edits into one save
 * costs one credit, not five) and matches ProfileEditLog's own doc comment in
 * schema.prisma. A call that changes nothing (all submitted values equal current
 * values) does not log an edit or consume a credit — see hasActualChanges below.
 */
export const EDIT_COUNTS_AS = 'one saved update, however many fields it changes, counts as one edit — not one edit per field'

// Allowlist of fields a member can edit through PATCH /api/profile. Deliberately
// excludes identity/trust fields (email, verification flags, plan/tier, dealerId,
// approval/status) and anything with its own dedicated flow (password reset,
// registration-only fields). Kept here — not inline in the route — so the route,
// the "what counts as a change" diff check, and any future admin-side mirror of
// this list all read from one place.
export const EDITABLE_PROFILE_FIELDS = [
  'name', 'phone', 'city', 'education', 'occupation', 'income', 'incomeBracket',
  'height', 'weight', 'bloodGroup', 'complexion', 'disabilityStatus',
  'foodPreference', 'hobbies', 'lifestyleInterests', 'languagesKnown', 'languagePreference',
  'familyType', 'partnerAgeRange', 'partnerReligion', 'partnerLocation',
  'nakshatra', 'rashi', 'birthTime', 'birthPlace',
]

/** Midnight on the 1st of the current calendar month, in server-local time. */
export function currentMonthStart() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** How many edits this user has already used up this calendar month. */
export async function editsUsedThisMonth(prisma, userId) {
  return prisma.profileEditLog.count({
    where: { userId, createdAt: { gte: currentMonthStart() } },
  })
}

/** Picks only the allowlisted fields that are actually different from `current`. */
export function diffEditableFields(current, submitted) {
  const changes = {}
  for (const key of EDITABLE_PROFILE_FIELDS) {
    if (!(key in submitted)) continue
    const next = submitted[key]
    if (next !== current[key]) changes[key] = next
  }
  return changes
}

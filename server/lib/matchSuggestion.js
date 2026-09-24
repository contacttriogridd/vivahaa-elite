// Lightweight compatibility scorer backing the admin Engagement section's "best
// match suggestion" column and the User Management role's curated-match action.
// Deliberately simple (attribute overlap, not the full browse/search ranking) —
// good enough for an admin's shortlist, not a replacement for member-facing search.
const opposite = (gender) => (gender === 'Male' ? 'Female' : gender === 'Female' ? 'Male' : undefined)

function score(user, candidate) {
  let s = 0
  if (user.partnerReligion && candidate.religion && user.partnerReligion.toLowerCase() === candidate.religion.toLowerCase()) s += 3
  if (user.partnerLocation && candidate.city && user.partnerLocation.toLowerCase() === candidate.city.toLowerCase()) s += 2
  if (user.caste && candidate.caste && user.caste === candidate.caste) s += 2
  if (user.motherTongue && candidate.motherTongue && user.motherTongue === candidate.motherTongue) s += 1
  if (user.plan === candidate.plan) s += 1
  return s
}

/**
 * Returns up to `limit` best-scoring opposite-gender candidates for `user`, best first.
 * `sameTierOnly` (used by the dealer match tool, Task 8: dealers may only suggest
 * matches within the same membership tier — a hard server-side filter, not a UI
 * convention) restricts candidates to the same `plan` as `user`. "Tier" here means
 * the PlanTier enum (SILVER/GOLD/DIAMOND/PLATINUM/PLATINUM_PLUS) — the same field
 * the admin Payments screen labels "Tier" (tierAtPayment) — not the coarser
 * standard/elite `User.tier` string.
 */
export async function suggestMatches(prisma, user, limit = 3, { sameTierOnly = false } = {}) {
  const targetGender = opposite(user.gender)
  if (!targetGender) return []

  const candidates = await prisma.user.findMany({
    where: {
      gender: targetGender,
      status: 'active',
      approved: true,
      id: { not: user.id },
      ...(sameTierOnly ? { plan: user.plan } : {}),
    },
    select: {
      id: true, name: true, city: true, religion: true, caste: true,
      motherTongue: true, plan: true, dob: true,
    },
    take: 200,
  })

  return candidates
    .map((c) => ({ ...c, score: score(user, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

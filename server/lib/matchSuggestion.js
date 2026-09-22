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

/** Returns up to `limit` best-scoring opposite-gender candidates for `user`, best first. */
export async function suggestMatches(prisma, user, limit = 3) {
  const targetGender = opposite(user.gender)
  if (!targetGender) return []

  const candidates = await prisma.user.findMany({
    where: {
      gender: targetGender,
      status: 'active',
      approved: true,
      id: { not: user.id },
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

/**
 * Single source of truth for membership tiers and pricing.
 *
 * `data.js`'s `PLANS` object re-exports from here in its original shape (a plain
 * `{ standard: [...], elite: [...] }` with lowercase `id`s) so every legacy `.jsx`
 * file that already imports `PLANS` from `data.js` — `Dealer.jsx`'s plan dropdown,
 * `Landing.jsx`'s old teaser — keeps working without modification. `planTier` is the
 * new bridge: it matches `prisma/schema.prisma`'s `PlanTier` enum exactly, so a real
 * `User.plan` value (e.g. `"PLATINUM_PLUS"`) can be resolved back to its full plan
 * record via `planByTier()`.
 */

export type PlanGroup = 'standard' | 'elite'

/** Matches prisma/schema.prisma's PlanTier enum. Keep these in sync. */
export type PlanTier = 'SILVER' | 'GOLD' | 'DIAMOND' | 'PLATINUM' | 'PLATINUM_PLUS'

export interface PlanDefinition {
  /** Lowercase, no underscore — matches the existing data.js convention. */
  id: string
  planTier: PlanTier
  group: PlanGroup
  name: string
  price: number
  duration: number
  features: string[]
  /**
   * Elite-only: what a Platinum/Platinum+ member gets beyond Standard, shown as a
   * distinct "Elite benefits" list on the membership cards rather than folded into
   * `features` — the whole point is that these read as qualitatively different, not
   * just "more of the same."
   */
  eliteBenefits?: string[]
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: 'silver',
    planTier: 'SILVER',
    group: 'standard',
    name: 'Silver',
    price: 499,
    duration: 30,
    features: ['50 profile views/mo', 'Basic filters', 'Email support'],
  },
  {
    id: 'gold',
    planTier: 'GOLD',
    group: 'standard',
    name: 'Gold',
    price: 699,
    duration: 30,
    features: ['Unlimited views', 'Advanced filters', 'Priority support'],
  },
  {
    id: 'diamond',
    planTier: 'DIAMOND',
    group: 'standard',
    name: 'Diamond',
    price: 899,
    duration: 30,
    features: ['All Gold +', 'Horoscope match', 'Dedicated RM'],
  },
  {
    id: 'platinum',
    planTier: 'PLATINUM',
    group: 'elite',
    name: 'Platinum',
    price: 1499,
    duration: 30,
    features: ['Curated matches', 'Concierge service', 'Exclusive events'],
    eliteBenefits: [
      'Dedicated relationship manager',
      'Human-assisted handpicked matches, not just algorithmic',
      'Priority profile visibility',
      'Unlimited direct messaging — no interest-approval gate',
      'AI horoscope match-making access',
      'Elite-only support line',
    ],
  },
  {
    id: 'platinumplus',
    planTier: 'PLATINUM_PLUS',
    group: 'elite',
    name: 'Platinum Plus',
    price: 2499,
    duration: 30,
    features: ['All Platinum +', 'Personal matchmaker', 'VIP lounge access'],
    eliteBenefits: [
      'Everything in Platinum',
      'Personal matchmaker (not just a relationship manager)',
      'Video call verification badge',
      'Early access to new profiles in your preference set',
      'Priority profile boosting',
    ],
  },
]

export const PLANS = {
  standard: PLAN_DEFINITIONS.filter((p) => p.group === 'standard'),
  elite: PLAN_DEFINITIONS.filter((p) => p.group === 'elite'),
}

export const planByTier = (planTier: string): PlanDefinition | undefined =>
  PLAN_DEFINITIONS.find((p) => p.planTier === planTier)

export const planById = (id: string): PlanDefinition | undefined =>
  PLAN_DEFINITIONS.find((p) => p.id === id)

/** A plan's `group` is the real source of truth for "is this member Elite." */
export const isElitePlanTier = (planTier: string): boolean =>
  planByTier(planTier)?.group === 'elite'

/**
 * Server-side mirror of src/lib/plans.ts's PLAN_DEFINITIONS.
 *
 * The server is plain Node ESM and does not compile src/'s TypeScript, so this is a
 * deliberate small duplication rather than a build-step dependency. Keep the `id`,
 * `planTier`, and `price` fields in sync with src/lib/plans.ts by hand — the server
 * only needs those three per plan (amount + which PlanTier enum value to snapshot on
 * the Payment row), not the marketing copy.
 */

export const PLAN_DEFINITIONS = [
  { id: 'silver', planTier: 'SILVER', group: 'standard', price: 499 },
  { id: 'gold', planTier: 'GOLD', group: 'standard', price: 699 },
  { id: 'diamond', planTier: 'DIAMOND', group: 'standard', price: 899 },
  { id: 'platinum', planTier: 'PLATINUM', group: 'elite', price: 1499 },
  { id: 'platinumplus', planTier: 'PLATINUM_PLUS', group: 'elite', price: 2499 },
]

export const planByTier = (planTier) => PLAN_DEFINITIONS.find((p) => p.planTier === planTier)

export const planById = (id) => PLAN_DEFINITIONS.find((p) => p.id === id)

/** A plan's `group` is the real source of truth for "is this member Elite" — matches
 * the same rule in src/lib/plans.ts's isElitePlanTier. */
export const isElitePlanTier = (planTier) => planByTier(planTier)?.group === 'elite'

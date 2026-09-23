import React from 'react'
import { motion } from 'framer-motion'
import { Check, Crown } from 'lucide-react'
import { PLAN_DEFINITIONS, type PlanTier } from '../../lib/plans'

/** Radio-selectable membership package cards, sourced from the same plan definitions
 * the admin Packages screen and User.plan enum use — see src/lib/plans.ts. */
export function MembershipPackageCards({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (planTier: PlanTier) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PLAN_DEFINITIONS.map((plan, index) => {
        const isSelected = selected === plan.planTier
        const isElite = plan.group === 'elite'
        return (
          <motion.button
            key={plan.id}
            type="button"
            onClick={() => onSelect(plan.planTier)}
            aria-pressed={isSelected}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4 }}
            className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
              isSelected
                ? 'border-royal-gold bg-royal-gold/10 shadow-[0_20px_50px_rgba(212,175,55,0.18)]'
                : 'border-royal-gold/20 bg-white/5 hover:border-royal-gold/40 hover:bg-white/[0.07]'
            }`}
          >
            {isElite && (
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-royal-gold to-transparent" />
            )}

            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-royal-gold">
                  {isElite ? 'Elite' : 'Standard'}
                </p>
                <h3 className="font-playfair text-xl font-semibold text-elite-text">{plan.name}</h3>
              </div>
              {isSelected && (
                <span className="rounded-full bg-royal-gold p-1 text-elite-bg">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            <p className="font-playfair text-2xl font-semibold text-royal-gold">
              ₹{plan.price.toLocaleString('en-IN')}
              <span className="ml-1 font-mono text-xs font-normal text-elite-muted">/{plan.duration}d</span>
            </p>

            <ul className="mt-4 space-y-1.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-xs text-elite-muted">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-royal-gold/70" />
                  {feature}
                </li>
              ))}
            </ul>

            {plan.eliteBenefits && (
              <div className="mt-3 flex items-start gap-1.5 rounded-xl border border-royal-gold/20 bg-royal-gold/5 p-2.5">
                <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal-gold" />
                <p className="text-[11px] leading-relaxed text-elite-muted">
                  {plan.eliteBenefits[0]} + {plan.eliteBenefits.length - 1} more elite benefits
                </p>
              </div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

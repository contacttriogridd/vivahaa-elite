import React from 'react'
import { Crown } from 'lucide-react'
import { MembershipPackageCards } from '../MembershipPackageCards'
import { RazorpayCheckout } from '../RazorpayCheckout'
import { labelForCaste, labelForReligion } from '../../../lib/taxonomy'
import type { PlanTier } from '../../../lib/plans'
import type { StepProps } from './shared'

interface Step5Props extends StepProps {
  draftToken: string | null
  onPaid: () => void
}

/** Step 5 of 5 — read-only review, package selection, Razorpay checkout, terms. */
export function Step5MembershipPayment({ errors, values, set, draftToken, onPaid }: Step5Props) {
  const reviewRows: Array<[string, string]> = [
    ['Full Name', values.fullName],
    ['Email', values.email],
    ['Mobile', values.mobile],
    ['City', values.location],
    ['Religion', values.religion ? labelForReligion(values.religion) : ''],
    ['Caste', values.caste ? labelForCaste(values.religion, values.caste) : ''],
    ['Occupation', values.occupation],
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-royal-gold/20 bg-royal-gold/10 p-4">
        <div className="flex items-center gap-2 text-royal-gold">
          <Crown className="h-4 w-4" />
          <span className="font-semibold">Review your profile</span>
        </div>
        <p className="mt-2 text-sm text-elite-muted">
          Verify your details before completing membership payment.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {reviewRows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-royal-gold">{label}</p>
            <p className="mt-1 text-sm text-elite-text">{value || '—'}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-elite-muted">
        Marital history, documents, family contact numbers, and your asset range are not listed
        here because they stay private.
      </p>

      <div className="border-t border-white/10 pt-5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-royal-gold">
          Choose your membership
        </p>
        <MembershipPackageCards
          selected={values.selectedPlan}
          onSelect={(planTier: PlanTier) => set('selectedPlan', planTier)}
        />
        {errors.selectedPlan && <p className="mt-2 text-xs text-red-500">{errors.selectedPlan.message}</p>}
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-royal-gold/20 bg-white/5 p-3 text-sm text-elite-muted">
        <input
          type="checkbox"
          checked={values.acceptTerms}
          onChange={(event) => set('acceptTerms', event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-royal-gold/30 text-royal-gold"
        />
        <span>
          I agree to the privacy policy, terms of service, and consent to secure verification of
          my profile.
        </span>
      </label>
      {errors.acceptTerms && <p className="text-xs text-red-500">{errors.acceptTerms.message}</p>}

      <div className="border-t border-white/10 pt-5">
        {values.selectedPlan && draftToken ? (
          <RazorpayCheckout
            draftToken={draftToken}
            planTier={values.selectedPlan as PlanTier}
            payerName={values.fullName}
            payerEmail={values.email}
            payerMobile={values.mobile}
            canPay={values.acceptTerms}
            onPaid={onPaid}
          />
        ) : (
          <p className="text-sm text-elite-muted">Select a package above to complete payment.</p>
        )}
      </div>
    </div>
  )
}

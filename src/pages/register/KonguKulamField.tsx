import React from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { Combobox } from '../../components/ui/combobox'
import { getKonguKulams, konguKulamsVerified } from '../../lib/taxonomy'

/**
 * Kulam / Koottam selector for the Kongu Vellalar Gounder community.
 *
 * This is the ONLY caste-specific section in the registration form, and it is kept in
 * its own file on purpose: the list and its accompanying note carry real community
 * weight, and a reviewer should be able to audit or replace both without reading any
 * of the surrounding caste/subcaste logic.
 *
 * Two rules govern it:
 *
 *  1. It renders only when the selected caste is gated to it. The caller owns that
 *     gate (`casteUsesKonguKulam` in src/lib/taxonomy.ts); this component never
 *     inspects the caste itself and must stay hidden for every other community.
 *  2. The same-kulam note below is INFORMATIONAL. It is not, and must not become,
 *     a validation rule. The platform's role here is to inform, not to enforce.
 *
 * The underlying list is seed data pending community review — see
 * src/data/taxonomy/README.md. Until it is reviewed, the field accepts a typed value
 * that is not in the list, so a missing kulam never blocks a registration.
 */
export function KonguKulamField({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const kulams = getKonguKulams()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-royal-gold/25 bg-royal-gold/5 p-4 md:col-span-2"
    >
      <Combobox
        label="Kulam / Koottam"
        value={value}
        onChange={onChange}
        options={kulams}
        error={error}
        allowCustom={!konguKulamsVerified}
        placeholder="Search your kulam"
        emptyMessage="Kulam list not loaded"
      />

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-elite-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal-gold" aria-hidden />
        <span>
          Marriage within the same kulam/koottam is traditionally prohibited in this
          community. We show this for your information only — it does not restrict who you
          can view or contact on Vivahaa Elite.
        </span>
      </p>

      {!konguKulamsVerified && (
        <p className="mt-2 text-[11px] leading-relaxed text-elite-muted/80">
          Don&apos;t see your kulam? Type it in and we&apos;ll record it — our list is still
          being reviewed with the community.
        </p>
      )}
    </motion.div>
  )
}

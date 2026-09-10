import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Plus, X, Upload } from 'lucide-react'
import { Input } from '../../components/ui/input'
import { needsDivorceDeclaration, needsWidowDeclaration } from './registrationSchema'

export interface ChildEntry {
  age: string
  livesWithMe: 'yes' | 'no' | 'shared' | ''
}

interface SecondMarriageSectionProps {
  maritalStatus: string
  hasChildren: 'yes' | 'no' | ''
  children: ChildEntry[]
  divorceDecreeConfirmed: boolean
  divorceDocumentName: string
  widowDeclarationConfirmed: boolean
  spousePassedOn: string
  onChange: (field: string, value: unknown) => void
  errors?: Record<string, string | undefined>
}

const fieldClass =
  'w-full rounded-xl border border-royal-gold/20 bg-white/10 px-4 py-3 text-sm text-elite-text'

const labelClass =
  'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-elite-muted'

/**
 * Shown only when marital status is something other than "Never Married". A first-time
 * marriage user never sees any of this, which is why it lives behind that gate rather
 * than being a permanently visible set of greyed-out questions.
 *
 * Everything captured here is private by default — see PRIVATE_BY_DEFAULT in
 * registrationSchema.ts. The widow/widower branch stays deliberately light: the date is
 * optional and there is no free-text explanation field.
 */
export function SecondMarriageSection({
  maritalStatus,
  hasChildren,
  children,
  divorceDecreeConfirmed,
  divorceDocumentName,
  widowDeclarationConfirmed,
  spousePassedOn,
  onChange,
  errors = {},
}: SecondMarriageSectionProps) {
  const updateChild = (index: number, patch: Partial<ChildEntry>) => {
    onChange(
      'children',
      children.map((child, i) => (i === index ? { ...child, ...patch } : child))
    )
  }

  const addChild = () => onChange('children', [...children, { age: '', livesWithMe: '' }])
  const removeChild = (index: number) =>
    onChange(
      'children',
      children.filter((_, i) => i !== index)
    )

  const setHasChildren = (value: 'yes' | 'no') => {
    onChange('hasChildren', value)
    if (value === 'no') onChange('children', [])
    else if (children.length === 0) onChange('children', [{ age: '', livesWithMe: '' }])
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4 rounded-2xl border border-royal-gold/20 bg-white/5 p-4 md:col-span-2"
    >
      <div className="flex items-start gap-2">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal-gold" aria-hidden />
        <p className="text-xs leading-relaxed text-elite-muted">
          These answers stay private. They are never shown on your public profile unless you
          choose to share them later.
        </p>
      </div>

      {/* Children */}
      <div>
        <span className={labelClass}>Do you have children?</span>
        <div className="flex gap-2">
          {(['yes', 'no'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setHasChildren(option)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                hasChildren === option
                  ? 'bg-royal-gold/20 text-royal-gold'
                  : 'bg-white/5 text-elite-muted'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {errors.hasChildren && <p className="mt-1 text-xs text-red-500">{errors.hasChildren}</p>}
      </div>

      {hasChildren === 'yes' && (
        <div className="space-y-3">
          {children.map((child, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:grid-cols-[1fr_1.4fr_auto]"
            >
              <Input
                label={`Child ${index + 1} — age`}
                inputMode="numeric"
                value={child.age}
                onChange={(event) => updateChild(index, { age: event.target.value })}
                error={errors[`children.${index}.age`]}
              />
              <div>
                <label className={labelClass}>Will live with you?</label>
                <select
                  className={fieldClass}
                  value={child.livesWithMe}
                  onChange={(event) =>
                    updateChild(index, { livesWithMe: event.target.value as ChildEntry['livesWithMe'] })
                  }
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="shared">Shared custody</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeChild(index)}
                aria-label={`Remove child ${index + 1}`}
                className="self-end rounded-lg p-2.5 text-elite-muted transition-colors hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addChild}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-royal-gold"
          >
            <Plus className="h-3.5 w-3.5" /> Add another child
          </button>
        </div>
      )}

      {/* Divorced / Awaiting Divorce */}
      {needsDivorceDeclaration(maritalStatus) && (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <label className="flex items-start gap-3 text-sm text-elite-text">
            <input
              type="checkbox"
              checked={divorceDecreeConfirmed}
              onChange={(event) => onChange('divorceDecreeConfirmed', event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-royal-gold/30 text-royal-gold"
            />
            <span>I confirm I have my divorce decree / final order.</span>
          </label>
          {errors.divorceDecreeConfirmed && (
            <p className="text-xs text-red-500">{errors.divorceDecreeConfirmed}</p>
          )}

          <div className="rounded-xl border border-dashed border-royal-gold/30 bg-white/5 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-royal-gold">
              <Upload className="h-4 w-4" />
              <span>{divorceDocumentName || 'Attach the document (optional)'}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(event) =>
                  onChange('divorceDocumentName', event.target.files?.[0]?.name ?? '')
                }
              />
            </label>
            <p className="mt-1.5 text-[11px] leading-relaxed text-elite-muted">
              Stored privately for verification only. Never shown on your profile, and never
              shared with other members.
            </p>
          </div>
        </div>
      )}

      {/* Widowed / Widower */}
      {needsWidowDeclaration(maritalStatus) && (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <label className="flex items-start gap-3 text-sm text-elite-text">
            <input
              type="checkbox"
              checked={widowDeclarationConfirmed}
              onChange={(event) => onChange('widowDeclarationConfirmed', event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-royal-gold/30 text-royal-gold"
            />
            <span>I confirm the information I have given about my marital status is accurate.</span>
          </label>
          {errors.widowDeclarationConfirmed && (
            <p className="text-xs text-red-500">{errors.widowDeclarationConfirmed}</p>
          )}
          <Input
            label="Date of your spouse's passing (optional)"
            type="date"
            value={spousePassedOn}
            onChange={(event) => onChange('spousePassedOn', event.target.value)}
          />
          <p className="text-[11px] leading-relaxed text-elite-muted">
            You can leave this blank. We ask only because some families look for it.
          </p>
        </div>
      )}
    </motion.div>
  )
}

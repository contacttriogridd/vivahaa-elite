import React from 'react'
import { Lock, Plus, X } from 'lucide-react'
import { Input } from '../../components/ui/input'
import { SIBLING_MARITAL_STATUSES } from './registrationSchema'

export interface ParentEntry {
  name: string
  occupation?: string
  phone?: string
}

export interface SiblingEntry {
  name: string
  gender: string
  maritalStatus: string
}

interface FamilyDetailsStepProps {
  father: ParentEntry
  mother: ParentEntry
  familyType: string
  hasSiblings: 'yes' | 'no' | ''
  siblings: SiblingEntry[]
  onChange: (field: string, value: unknown) => void
  errors?: Record<string, string | undefined>
}

// Renders only inside the wizard's always-dark panel — see the note in
// RegistrationWizard.tsx on why this can't use the std/elite dark: pairing.
const fieldClass =
  'w-full rounded-xl border border-royal-gold/20 bg-white/10 px-4 py-3 text-sm text-elite-text'

const labelClass =
  'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-elite-muted'

function ParentFields({
  title,
  prefix,
  parent,
  onChange,
  errors,
}: {
  title: string
  prefix: 'father' | 'mother'
  parent: ParentEntry
  onChange: (field: string, value: unknown) => void
  errors: Record<string, string | undefined>
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-royal-gold">{title}</p>
      <Input
        label="Name"
        value={parent.name}
        onChange={(event) => onChange(`${prefix}.name`, event.target.value)}
        error={errors[`${prefix}.name`]}
      />
      <Input
        label="Occupation (optional)"
        value={parent.occupation ?? ''}
        onChange={(event) => onChange(`${prefix}.occupation`, event.target.value)}
      />
      <Input
        label="Contact number (optional)"
        type="tel"
        value={parent.phone ?? ''}
        onChange={(event) => onChange(`${prefix}.phone`, event.target.value)}
      />
    </div>
  )
}

export function FamilyDetailsStep({
  father,
  mother,
  familyType,
  hasSiblings,
  siblings,
  onChange,
  errors = {},
}: FamilyDetailsStepProps) {
  const updateSibling = (index: number, patch: Partial<SiblingEntry>) => {
    onChange(
      'siblings',
      siblings.map((sibling, i) => (i === index ? { ...sibling, ...patch } : sibling))
    )
  }

  const addSibling = () =>
    onChange('siblings', [...siblings, { name: '', gender: '', maritalStatus: '' }])

  const removeSibling = (index: number) =>
    onChange(
      'siblings',
      siblings.filter((_, i) => i !== index)
    )

  const setHasSiblings = (value: 'yes' | 'no') => {
    onChange('hasSiblings', value)
    if (value === 'no') onChange('siblings', [])
    else if (siblings.length === 0) addSibling()
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <ParentFields title="Father" prefix="father" parent={father} onChange={onChange} errors={errors} />
        <ParentFields title="Mother" prefix="mother" parent={mother} onChange={onChange} errors={errors} />
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-elite-muted">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal-gold" aria-hidden />
        <span>
          Your parents&apos; contact numbers stay private. They are never shown on your public
          profile — we use them only if you ask us to involve your family in a conversation.
        </span>
      </p>

      <Input
        label="Family Type"
        placeholder="Nuclear, joint, …"
        value={familyType}
        onChange={(event) => onChange('familyType', event.target.value)}
        error={errors.familyType}
      />

      {/* Siblings */}
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <span className={labelClass}>Siblings</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setHasSiblings('yes')}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              hasSiblings === 'yes'
                ? 'bg-royal-gold/20 text-royal-gold'
                : 'bg-white/5 text-elite-muted'
            }`}
          >
            I have siblings
          </button>
          <button
            type="button"
            onClick={() => setHasSiblings('no')}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              hasSiblings === 'no'
                ? 'bg-royal-gold/20 text-royal-gold'
                : 'bg-white/5 text-elite-muted'
            }`}
          >
            No siblings
          </button>
        </div>

        {hasSiblings === 'yes' && (
          <div className="space-y-3 pt-1">
            {siblings.map((sibling, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:grid-cols-[1.6fr_1fr_1.2fr_auto]"
              >
                <Input
                  label="Name"
                  value={sibling.name}
                  onChange={(event) => updateSibling(index, { name: event.target.value })}
                  error={errors[`siblings.${index}.name`]}
                />
                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    className={fieldClass}
                    value={sibling.gender}
                    onChange={(event) => updateSibling(index, { gender: event.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors[`siblings.${index}.gender`] && (
                    <p className="mt-1 text-xs text-red-500">{errors[`siblings.${index}.gender`]}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Marital status</label>
                  <select
                    className={fieldClass}
                    value={sibling.maritalStatus}
                    onChange={(event) => updateSibling(index, { maritalStatus: event.target.value })}
                  >
                    <option value="">Select</option>
                    {SIBLING_MARITAL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {errors[`siblings.${index}.maritalStatus`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`siblings.${index}.maritalStatus`]}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeSibling(index)}
                  aria-label={`Remove sibling ${index + 1}`}
                  className="self-end rounded-lg p-2.5 text-elite-muted transition-colors hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSibling}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-royal-gold"
            >
              <Plus className="h-3.5 w-3.5" /> Add another sibling
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

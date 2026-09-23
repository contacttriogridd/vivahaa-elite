import React from 'react'
import { Input } from '../../../components/ui/input'
import { CommunityFields } from '../CommunityFields'
import { HoroscopeStep } from '../HoroscopeStep'
import { COMPLEXIONS } from '../registrationSchema'
import { labelClass, selectClass, type StepProps } from './shared'

/**
 * Step 2 of 5 — Religion/caste/subcaste cascade, mother tongue, physical attributes,
 * disability status, and (folded in here, since birth details are personal background
 * with no dedicated row in the spec's step table) horoscope.
 */
export function Step2CommunityBackground({ register, errors, fieldErrors, values, set }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <CommunityFields
          religion={values.religion}
          caste={values.caste ?? ''}
          subcaste={values.subcaste ?? ''}
          kulam={values.kulam ?? ''}
          onChange={set}
          errors={{
            religion: fieldErrors.religion,
            caste: fieldErrors.caste,
            subcaste: fieldErrors.subcaste,
            kulam: fieldErrors.kulam,
          }}
        />

        <Input label="Mother Tongue" error={errors.motherTongue?.message} {...register('motherTongue')} />

        <Input label="Height" error={errors.height?.message} {...register('height')} />
        <Input label="Weight" error={errors.weight?.message} {...register('weight')} />
        <Input label="Blood Group" error={errors.bloodGroup?.message} {...register('bloodGroup')} />

        <div>
          <label className={labelClass}>Complexion (optional)</label>
          <select className={selectClass} {...register('complexion')}>
            <option value="">Prefer not to say</option>
            {COMPLEXIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Disability status (optional)"
          placeholder="None, or describe briefly"
          {...register('disabilityStatus')}
        />
      </div>

      <div className="border-t border-white/10 pt-5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-royal-gold">
          Horoscope (optional)
        </p>
        <HoroscopeStep
          dob={values.dob}
          birthTime={values.birthTime ?? ''}
          birthPlace={values.birthPlace ?? ''}
          nakshatra={values.nakshatra ?? ''}
          rasi={values.rasi ?? ''}
          noHoroscopeChart={values.noHoroscopeChart}
          onChange={set}
        />
      </div>
    </div>
  )
}

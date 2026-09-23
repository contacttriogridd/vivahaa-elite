import React from 'react'
import { Input } from '../../../components/ui/input'
import { FamilyDetailsStep } from '../FamilyDetailsStep'
import { labelClass, selectClass, type StepProps } from './shared'

/**
 * Step 3 of 5 — Education/occupation/income, family details, and (folded in here —
 * no dedicated row in the spec's step table, closest fit is family/background)
 * lifestyle: food preference, hobbies, interests, languages known.
 */
export function Step3EducationCareerFamily({ register, errors, fieldErrors, values, set }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Highest Qualification" error={errors.qualification?.message} {...register('qualification')} />
        <Input label="Occupation" error={errors.occupation?.message} {...register('occupation')} />
        <Input label="Annual Income" error={errors.income?.message} {...register('income')} />
      </div>

      <div className="border-t border-white/10 pt-5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-royal-gold">Family</p>
        <FamilyDetailsStep
          father={values.father}
          mother={values.mother}
          familyType={values.familyType}
          hasSiblings={values.hasSiblings}
          siblings={values.siblings}
          onChange={set}
          errors={fieldErrors}
        />
      </div>

      <div className="border-t border-white/10 pt-5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-royal-gold">Lifestyle</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Food Preference</label>
            <select className={selectClass} {...register('foodPreference')}>
              <option value="">Select</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Eggetarian">Eggetarian</option>
            </select>
            {errors.foodPreference && <p className="mt-1 text-xs text-red-500">{errors.foodPreference.message}</p>}
          </div>
          <Input label="Hobbies" error={errors.hobbies?.message} {...register('hobbies')} />
          <Input label="Interests" error={errors.interests?.message} {...register('interests')} />
          <Input label="Languages Known" error={errors.languages?.message} {...register('languages')} />
        </div>
      </div>
    </div>
  )
}

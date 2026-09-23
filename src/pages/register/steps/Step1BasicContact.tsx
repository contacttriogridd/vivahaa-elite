import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Phone, Lock, User, MapPin } from 'lucide-react'
import { Input } from '../../../components/ui/input'
import { SecondMarriageSection } from '../SecondMarriageSection'
import { MARITAL_STATUSES, isRemarriage } from '../registrationSchema'
import { labelClass, selectClass, type StepProps } from './shared'

/** Step 1 of 5 — Name, gender, DOB, mobile, email, city, marital status. */
export function Step1BasicContact({ register, errors, fieldErrors, values, set }: StepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const age = (() => {
    if (!values.dob) return '—'
    const dob = new Date(values.dob)
    if (Number.isNaN(dob.getTime())) return '—'
    const diff = Date.now() - dob.getTime()
    return Math.abs(new Date(diff).getUTCFullYear() - 1970).toString()
  })()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Full Name" icon={<User className="h-4 w-4" />} error={errors.fullName?.message} {...register('fullName')} />
        <div>
          <label className={labelClass}>Gender</label>
          <select className={selectClass} {...register('gender')}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>}
        </div>
        <Input label="Date of Birth" type="date" error={errors.dob?.message} {...register('dob')} />
        <div className="rounded-2xl border border-royal-gold/20 bg-royal-gold/10 p-4 text-sm text-elite-text">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-royal-gold">Calculated age</p>
          <p className="mt-2 font-playfair text-2xl text-royal-gold">{age}</p>
        </div>
        <Input label="Mobile Number" icon={<Phone className="h-4 w-4" />} error={errors.mobile?.message} {...register('mobile')} />
        <Input label="Email Address" icon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
        <div className="relative">
          <Input label="Password" type={showPassword ? 'text' : 'password'} icon={<Lock className="h-4 w-4" />} error={errors.password?.message} {...register('password')} />
          <button type="button" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-[34px] text-elite-muted">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="relative">
          <Input label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} icon={<Lock className="h-4 w-4" />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-[34px] text-elite-muted">
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Input label="City / State" icon={<MapPin className="h-4 w-4" />} placeholder="e.g. Coimbatore, Tamil Nadu" error={errors.location?.message} {...register('location')} />
        <div>
          <label className={labelClass}>Preferred Language</label>
          <select className={selectClass} {...register('languagePreference')}>
            <option value="English">English</option>
            <option value="தமிழ்">Tamil</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Marital Status</label>
        <select
          className={selectClass}
          value={values.maritalStatus}
          onChange={(event) => {
            const next = event.target.value
            set('maritalStatus', next)
            // Leaving a remarriage status must not strand its answers on the profile.
            if (!isRemarriage(next)) {
              set('hasChildren', '')
              set('children', [])
              set('divorceDecreeConfirmed', false)
              set('divorceDocumentName', '')
              set('widowDeclarationConfirmed', false)
              set('spousePassedOn', '')
            }
          }}
        >
          <option value="">Select</option>
          {MARITAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {fieldErrors.maritalStatus && <p className="mt-1 text-xs text-red-500">{fieldErrors.maritalStatus}</p>}
      </div>

      {isRemarriage(values.maritalStatus) && (
        <SecondMarriageSection
          maritalStatus={values.maritalStatus}
          hasChildren={values.hasChildren}
          children={values.children}
          divorceDecreeConfirmed={values.divorceDecreeConfirmed}
          divorceDocumentName={values.divorceDocumentName ?? ''}
          widowDeclarationConfirmed={values.widowDeclarationConfirmed}
          spousePassedOn={values.spousePassedOn ?? ''}
          onChange={set}
          errors={fieldErrors}
        />
      )}
    </div>
  )
}

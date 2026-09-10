import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Crown,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  User,
  BadgeCheck,
  ImagePlus,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { GlassCard } from '../../components/ui/card'
import { CommunityFields } from './CommunityFields'
import { SecondMarriageSection } from './SecondMarriageSection'
import { FamilyDetailsStep } from './FamilyDetailsStep'
import { HoroscopeStep } from './HoroscopeStep'
import { AssetDetailsStep } from './AssetDetailsStep'
import {
  MARITAL_STATUSES,
  defaultValues,
  isRemarriage,
  registerSchema,
  stepDescriptions,
  stepFields,
  stepTitles,
  steps,
  type RegisterFormValues,
  type StepKey,
} from './registrationSchema'
import { labelForCaste, labelForKulam, labelForReligion, labelForSubcaste } from '../../lib/taxonomy'

// This panel is always dark (bg-elite-bg, unconditionally) regardless of the
// browser's light/dark preference, so text here must NOT use the std/elite
// dark: pairing — that pairing only resolves correctly when a surrounding
// background flips with it (as Input/Combobox's own backgrounds do). A plain
// dark: prefix here left `text-std-text` (near-black) showing on this
// near-black panel for anyone without OS-level dark mode on.
const selectClass =
  'w-full rounded-xl border border-royal-gold/20 bg-white/10 px-4 py-3 text-sm text-elite-text'

const labelClass =
  'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-elite-muted'

/**
 * Flatten nested/array RHF errors to dotted paths, so child components stay simple.
 *
 * Every RHF FieldError carries a `ref` pointing at the live DOM node for that field,
 * and React attaches its internal fiber tree directly onto that node — a graph that
 * loops back on itself (fiber -> stateNode -> node -> fiber -> ...). Recursing into
 * `ref` walks straight into that cycle and blows the call stack, which crashes the
 * whole wizard (any validation failure would blank the screen). `ref` must never be
 * treated as a nested error to flatten, and we skip any DOM node as a second guard.
 */
function flattenErrors(errors: FieldErrors, prefix = ''): Record<string, string | undefined> {
  const flat: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(errors ?? {})) {
    if (!value || key === 'ref') continue
    const path = prefix ? `${prefix}.${key}` : key
    const message = (value as { message?: unknown }).message
    if (typeof message === 'string') flat[path] = message
    if (typeof value === 'object' && !(value instanceof Node)) {
      Object.assign(flat, flattenErrors(value as FieldErrors, path))
    }
  }
  return flat
}

/** Count leaf values that carry something, for the completion readout. */
function countFilled(value: unknown): { filled: number; total: number } {
  if (Array.isArray(value)) {
    return value.reduce<{ filled: number; total: number }>(
      (acc, item) => {
        const inner = countFilled(item)
        return { filled: acc.filled + inner.filled, total: acc.total + inner.total }
      },
      { filled: 0, total: 0 }
    )
  }
  if (value && typeof value === 'object') {
    return Object.values(value).reduce<{ filled: number; total: number }>(
      (acc, item) => {
        const inner = countFilled(item)
        return { filled: acc.filled + inner.filled, total: acc.total + inner.total }
      },
      { filled: 0, total: 0 }
    )
  }
  const filled = typeof value === 'boolean' ? (value ? 1 : 0) : String(value ?? '').trim() ? 1 : 0
  return { filled, total: 1 }
}

export default function RegistrationWizard({ onSuccess }: { onSuccess?: () => void }) {
  const { register: registerUser } = useAuth()
  const [stepIndex, setStepIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const values = watch()
  const fieldErrors = useMemo(() => flattenErrors(errors), [errors])

  /** Single setter for the controlled sub-components, including dotted paths. */
  const set = (field: string, value: unknown) =>
    setValue(field as keyof RegisterFormValues, value as never, { shouldDirty: true })

  const age = useMemo(() => {
    if (!values.dob) return '—'
    const dob = new Date(values.dob)
    if (Number.isNaN(dob.getTime())) return '—'
    const diff = Date.now() - dob.getTime()
    return Math.abs(new Date(diff).getUTCFullYear() - 1970).toString()
  }, [values.dob])

  const completion = useMemo(() => {
    const { filled, total } = countFilled(values)
    return total === 0 ? 0 : Math.round((filled / total) * 100)
  }, [values])

  const currentStep = steps[stepIndex]

  const nextStep = async () => {
    const fields = stepFields[currentStep]
    if (fields.length > 0) {
      const valid = await trigger(fields)
      if (!valid) return
    }
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const prevStep = () => setStepIndex((prev) => Math.max(prev - 1, 0))

  /** If final validation trips on an earlier step, take the user back to it. */
  const onInvalid = (formErrors: FieldErrors) => {
    const failed = Object.keys(flattenErrors(formErrors))
    const target = steps.findIndex((step) =>
      stepFields[step].some((field) => failed.some((path) => path === field || path.startsWith(`${field}.`)))
    )
    if (target >= 0) setStepIndex(target)
  }

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true)
    setSubmitError('')
    setSubmitMessage('')
    try {
      const payload = {
        name: data.fullName,
        email: data.email,
        password: data.password,
        mobile: data.mobile,
        gender: data.gender,
        dob: data.dob,

        // Human-readable values for the existing profile columns…
        religion: labelForReligion(data.religion),
        caste: data.caste ? labelForCaste(data.religion, data.caste) : '',
        subcaste: data.subcaste ? labelForSubcaste(data.religion, data.caste ?? '', data.subcaste) : '',
        kulam: data.kulam ? labelForKulam(data.kulam) : '',
        // …plus the stable ids, which are what matching should key on.
        community: {
          religionId: data.religion,
          casteId: data.caste,
          subcasteId: data.subcaste,
          kulamId: data.kulam,
        },

        motherTongue: data.motherTongue,
        height: data.height,
        weight: data.weight,
        bloodGroup: data.bloodGroup,
        qualification: data.qualification,
        occupation: data.occupation,
        income: data.income,
        location: data.location,

        family: {
          father: { name: data.father.name, occupation: data.father.occupation },
          mother: { name: data.mother.name, occupation: data.mother.occupation },
          familyType: data.familyType,
          siblings: data.siblings,
        },

        horoscope: {
          birthTime: data.birthTime,
          birthPlace: data.birthPlace,
          nakshatra: data.nakshatra,
          rasi: data.rasi,
        },

        foodPreference: data.foodPreference,
        hobbies: data.hobbies,
        interests: data.interests,
        languages: data.languages,
        partnerAge: data.partnerAge,
        partnerReligion: data.partnerReligion,
        partnerLocation: data.partnerLocation,
        languagePreference: data.languagePreference,
        profileCompletion: Math.min(100, completion),

        /**
         * Private by default. Kept in its own object so the boundary is visible in the
         * request body itself and cannot be lost to a careless spread on the server.
         * Nothing in here may reach a public profile without an explicit opt-in.
         */
        private: {
          maritalStatus: data.maritalStatus,
          hasChildren: data.hasChildren,
          children: data.children,
          divorceDecreeConfirmed: data.divorceDecreeConfirmed,
          divorceDocumentName: data.divorceDocumentName,
          widowDeclarationConfirmed: data.widowDeclarationConfirmed,
          spousePassedOn: data.spousePassedOn,
          totalAssetValue: data.totalAssetValue,
          fatherPhone: data.father.phone,
          motherPhone: data.mother.phone,
        },
      }
      await registerUser(payload)
      setSubmitMessage('Your profile has been submitted successfully. Welcome to Vivahaa Elite.')
      onSuccess?.()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setSubmitError(message || 'Unable to create profile right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-elite-bg text-elite-text">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.25),transparent_35%)]" />
        <div className="absolute right-10 top-10 h-56 w-56 rounded-full bg-royal-gold/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-royal-maroon/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-royal-gold/20 bg-white/5 px-4 py-4 backdrop-blur-xl">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-royal-gold">
              Vivahaa Elite
            </p>
            <h1 className="font-playfair text-2xl font-semibold text-elite-text">
              Create Your Premium Profile
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-royal-gold/20 bg-royal-gold/10 px-3 py-1 text-sm text-royal-gold">
              {completion}% complete
            </div>
          </div>
        </header>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <GlassCard glow className="p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-royal-gold">
                  Step {stepIndex + 1} of {steps.length}
                </p>
                <h2 className="font-playfair text-xl font-semibold text-elite-text">
                  {stepTitles[currentStep]}
                </h2>
                <p className="mt-1 text-sm text-elite-muted">{stepDescriptions[currentStep]}</p>
              </div>
              <div className="rounded-2xl border border-royal-gold/20 bg-royal-gold/10 p-3 text-royal-gold">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            {/* Step indicator: hairline segments, one per step. */}
            <div className="flex items-center gap-1.5">
              {steps.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  title={stepTitles[step]}
                  aria-label={`Step ${index + 1}: ${stepTitles[step]}`}
                  aria-current={index === stepIndex ? 'step' : undefined}
                  onClick={() => index < stepIndex && setStepIndex(index)}
                  disabled={index > stepIndex}
                  className="group flex-1 py-2"
                >
                  <span
                    className={`block h-px w-full transition-all duration-500 ${
                      index === stepIndex
                        ? 'h-[2px] bg-royal-gold'
                        : index < stepIndex
                          ? 'bg-royal-gold/50'
                          : 'bg-white/15'
                    }`}
                  />
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-royal-gold/10 p-3 text-royal-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-playfair text-lg font-semibold text-elite-text">Private by default</p>
                <p className="text-sm text-elite-muted">
                  Marital history, documents, family contact numbers, and asset range are never
                  shown on your public profile unless you turn them on.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[28px] border border-royal-gold/20 bg-white/5 p-4 backdrop-blur-xl sm:p-6"
            >
              {currentStep === 'basic' && (
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
                  <div>
                    <label className={labelClass}>Preferred Language</label>
                    <select className={selectClass} {...register('languagePreference')}>
                      <option value="English">English</option>
                      <option value="தமிழ்">Tamil</option>
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 'personal' && (
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
                    {fieldErrors.maritalStatus && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.maritalStatus}</p>
                    )}
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

                  <Input label="Height" error={errors.height?.message} {...register('height')} />
                  <Input label="Weight" error={errors.weight?.message} {...register('weight')} />
                  <Input label="Blood Group" error={errors.bloodGroup?.message} {...register('bloodGroup')} />
                </div>
              )}

              {currentStep === 'education' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Highest Qualification" error={errors.qualification?.message} {...register('qualification')} />
                  <Input label="Occupation" error={errors.occupation?.message} {...register('occupation')} />
                  <Input label="Annual Income" error={errors.income?.message} {...register('income')} />
                  <Input label="Work Location" error={errors.location?.message} {...register('location')} />
                </div>
              )}

              {currentStep === 'family' && (
                <FamilyDetailsStep
                  father={values.father}
                  mother={values.mother}
                  familyType={values.familyType}
                  hasSiblings={values.hasSiblings}
                  siblings={values.siblings}
                  onChange={set}
                  errors={fieldErrors}
                />
              )}

              {currentStep === 'horoscope' && (
                <HoroscopeStep
                  dob={values.dob}
                  birthTime={values.birthTime ?? ''}
                  birthPlace={values.birthPlace ?? ''}
                  nakshatra={values.nakshatra ?? ''}
                  rasi={values.rasi ?? ''}
                  noHoroscopeChart={values.noHoroscopeChart}
                  onChange={set}
                />
              )}

              {currentStep === 'assets' && (
                <AssetDetailsStep
                  totalAssetValue={values.totalAssetValue}
                  onChange={set}
                  error={fieldErrors.totalAssetValue}
                />
              )}

              {currentStep === 'lifestyle' && (
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
              )}

              {currentStep === 'preferences' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Preferred Age" error={errors.partnerAge?.message} {...register('partnerAge')} />
                  <Input label="Preferred Religion" error={errors.partnerReligion?.message} {...register('partnerReligion')} />
                  <Input label="Preferred Location" error={errors.partnerLocation?.message} {...register('partnerLocation')} />
                </div>
              )}

              {currentStep === 'upload' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-dashed border-royal-gold/30 bg-white/5 p-4">
                    <p className="font-medium text-elite-text">Profile Picture</p>
                    <p className="mt-1 text-sm text-elite-muted">JPEG or PNG under 2MB</p>
                    <div className="mt-3 flex items-center gap-2 text-royal-gold">
                      <ImagePlus className="h-4 w-4" /> <span className="text-sm">Upload soon</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-royal-gold/30 bg-white/5 p-4">
                    <p className="font-medium text-elite-text">Horoscope / Verification</p>
                    <p className="mt-1 text-sm text-elite-muted">PDF or image upload ready for future integration</p>
                    <div className="mt-3 flex items-center gap-2 text-royal-gold">
                      <BadgeCheck className="h-4 w-4" /> <span className="text-sm">Secure and encrypted</span>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'review' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-royal-gold/20 bg-royal-gold/10 p-4">
                    <div className="flex items-center gap-2 text-royal-gold">
                      <Crown className="h-4 w-4" />
                      <span className="font-semibold">Review your profile</span>
                    </div>
                    <p className="mt-2 text-sm text-elite-muted">
                      Verify your details before submitting to the premium community.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      ['Full Name', values.fullName],
                      ['Email', values.email],
                      ['Mobile', values.mobile],
                      ['Religion', values.religion ? labelForReligion(values.religion) : ''],
                      ['Caste', values.caste ? labelForCaste(values.religion, values.caste) : ''],
                      ...(values.kulam ? [['Kulam / Koottam', labelForKulam(values.kulam)] as const] : []),
                      ['Occupation', values.occupation],
                      ['Location', values.location],
                    ] as const).map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-royal-gold">{label}</p>
                        <p className="mt-1 text-sm text-elite-text">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-elite-muted">
                    Marital history, documents, family contact numbers, and your asset range are not
                    listed here because they stay private.
                  </p>
                  <label className="flex items-start gap-3 rounded-2xl border border-royal-gold/20 bg-white/5 p-3 text-sm text-elite-muted">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-royal-gold/30 text-royal-gold" {...register('acceptTerms')} />
                    <span>
                      I agree to the privacy policy, terms of service, and consent to secure
                      verification of my profile.
                    </span>
                  </label>
                  {errors.acceptTerms && <p className="text-xs text-red-500">{errors.acceptTerms.message}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {(submitError || submitMessage) && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                submitError
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {submitError || submitMessage}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={prevStep} disabled={stepIndex === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {currentStep === 'review' ? (
              <Button type="submit" variant="elite" disabled={isSubmitting}>
                {isSubmitting ? 'Creating profile...' : 'Create Profile'}
              </Button>
            ) : (
              <Button type="button" variant="elite" onClick={nextStep}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

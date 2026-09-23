import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ArrowLeft, Sparkles, ShieldCheck, Save, Check, Loader2, PartyPopper } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { FormToneProvider } from '../../components/ui/formTone'
import API from '../../lib/api'
import {
  defaultValues,
  registerSchema,
  stepDescriptions,
  stepFields,
  stepTitles,
  steps,
  type RegisterFormValues,
  type StepKey,
} from './registrationSchema'

const DRAFT_TOKEN_KEY = 'vivahaa_reg_draft_token'
const AUTOSAVE_DEBOUNCE_MS = 800

// Each step is its own chunk, loaded only when the member reaches it — critically,
// this is also what keeps Step 5's Razorpay dependency (loaded inside
// RazorpayCheckout.tsx) out of every other step's bundle. See the registration
// rebuild plan's "Performance" section.
const Step1BasicContact = lazy(() => import('./steps/Step1BasicContact').then((m) => ({ default: m.Step1BasicContact })))
const Step2CommunityBackground = lazy(() => import('./steps/Step2CommunityBackground').then((m) => ({ default: m.Step2CommunityBackground })))
const Step3EducationCareerFamily = lazy(() => import('./steps/Step3EducationCareerFamily').then((m) => ({ default: m.Step3EducationCareerFamily })))
const Step4AssetsPhotosPartner = lazy(() => import('./steps/Step4AssetsPhotosPartner').then((m) => ({ default: m.Step4AssetsPhotosPartner })))
const Step5MembershipPayment = lazy(() => import('./steps/Step5MembershipPayment').then((m) => ({ default: m.Step5MembershipPayment })))

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

/**
 * A quick, non-authoritative read on whether every field this step requires has
 * *something* in it — used only to decide whether the Save button is enabled.
 * Booleans, arrays, and nested objects (children/siblings/father/mother) aren't
 * gated here since "empty" is often a valid answer for them (e.g. no siblings); the
 * real gate before an actual save is still the zod-backed `trigger()` call.
 */
function isStepFilled(fields: readonly string[], values: RegisterFormValues): boolean {
  return fields.every((field) => {
    const value = (values as Record<string, unknown>)[field]
    if (typeof value === 'boolean' || Array.isArray(value) || (value && typeof value === 'object')) return true
    return String(value ?? '').trim().length > 0
  })
}

function StepSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )
}

export default function RegistrationWizard({ onSuccess }: { onSuccess?: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [draftToken, setDraftToken] = useState<string | null>(null)
  const [resuming, setResuming] = useState(true)
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
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

  const completion = useMemo(() => {
    const { filled, total } = countFilled(values)
    return total === 0 ? 0 : Math.round((filled / total) * 100)
  }, [values])

  const currentStep = steps[stepIndex]

  // ── Resume-on-refresh: load a previously-saved draft, if this browser has one ──
  useEffect(() => {
    const existingToken = localStorage.getItem(DRAFT_TOKEN_KEY)
    if (!existingToken) {
      setResuming(false)
      return
    }
    API.get(`/registration/draft/${existingToken}`)
      .then(({ data }) => {
        if (data.status === 'paid') {
          // A stray token from a completed registration — nothing to resume.
          localStorage.removeItem(DRAFT_TOKEN_KEY)
          return
        }
        setDraftToken(existingToken)
        reset({ ...defaultValues, ...data.payload })
        setStepIndex(Math.min(data.currentStep ?? 0, steps.length - 1))
      })
      .catch(() => localStorage.removeItem(DRAFT_TOKEN_KEY))
      .finally(() => setResuming(false))
    // Only ever runs once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Autosave: debounced, fires on any field change, never per-keystroke synchronously ──
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestValues = useRef(values)
  latestValues.current = values

  const saveDraft = async (stepIndexAtSave: number) => {
    try {
      const { data } = await API.post('/registration/draft', {
        draftToken,
        step: steps[stepIndexAtSave],
        currentStep: stepIndexAtSave,
        data: latestValues.current,
      })
      if (data.draftToken && data.draftToken !== draftToken) {
        setDraftToken(data.draftToken)
        localStorage.setItem(DRAFT_TOKEN_KEY, data.draftToken)
      }
    } catch {
      // A transient autosave failure isn't worth interrupting the member over — the
      // next debounce tick or step change will simply retry with the latest values.
    }
  }

  useEffect(() => {
    if (resuming) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDraft(stepIndex), AUTOSAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), resuming])

  const nextStep = async () => {
    const fields = stepFields[currentStep]
    if (fields.length > 0) {
      const valid = await trigger(fields)
      if (!valid) return
    }
    // Fire-and-forget — the step transition itself should feel instant (optimistic UI);
    // the debounced watcher above would also catch this, but an explicit save on every
    // transition means a refresh right after advancing never loses the step just left.
    saveDraft(stepIndex)
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const prevStep = () => {
    saveDraft(stepIndex)
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  // ── Explicit per-section Save: validates this step's required fields, then saves
  // and shows a confirmation. Separate from the silent autosave above — this is the
  // visible "yes, this section is saved" action a member can trigger on demand. ──
  const [saveStatus, setSaveStatus] = useState<'idle' | 'checking' | 'saved' | 'incomplete'>('idle')
  const saveStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepIsFilled = useMemo(() => isStepFilled(stepFields[currentStep], values), [currentStep, values])

  const handleSaveStep = async () => {
    setSaveStatus('checking')
    const fields = stepFields[currentStep]
    const valid = fields.length === 0 || (await trigger(fields))
    if (!valid) {
      setSaveStatus('incomplete')
    } else {
      await saveDraft(stepIndex)
      setSaveStatus('saved')
    }
    if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current)
    saveStatusTimer.current = setTimeout(() => setSaveStatus('idle'), 3000)
  }

  useEffect(() => {
    // Switching steps clears any lingering "Saved"/"Incomplete" badge from the last one.
    setSaveStatus('idle')
    return () => {
      if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current)
    }
  }, [currentStep])

  /** If final validation trips on an earlier step, take the user back to it. */
  const onInvalid = (formErrors: FieldErrors) => {
    const failed = Object.keys(flattenErrors(formErrors))
    const target = steps.findIndex((step) =>
      stepFields[step].some((field) => failed.some((path) => path === field || path.startsWith(`${field}.`)))
    )
    if (target >= 0) setStepIndex(target)
  }

  /** Reached once the Razorpay webhook has actually confirmed payment (see
   * Step5MembershipPayment's RazorpayCheckout, which polls for this rather than
   * trusting its own client-side success callback). Nothing is created by this
   * function itself — the account already exists server-side by the time it fires. */
  const [paymentComplete, setPaymentComplete] = useState(false)

  const handlePaid = () => {
    localStorage.removeItem(DRAFT_TOKEN_KEY)
    setPaymentComplete(true)
  }

  // A brief, visible confirmation before handing off to login — instant, silent
  // redirects read as "did that actually work?" right after a payment.
  useEffect(() => {
    if (!paymentComplete) return
    const timer = setTimeout(() => onSuccess?.(), 3000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentComplete])

  // Step 5's "submit" is really just final client-side validation before payment can
  // start — account creation itself happens only from the webhook.
  const onSubmit = () => {
    setSubmitError('')
  }

  if (resuming) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-elite-bg">
        <StepSkeleton />
      </div>
    )
  }

  if (paymentComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-elite-bg px-4 text-center text-elite-text">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md rounded-[28px] border border-royal-gold/20 bg-white/5 p-8 backdrop-blur-xl"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-royal-gold/10 text-royal-gold">
            <PartyPopper className="h-8 w-8" />
          </div>
          <h1 className="font-playfair text-2xl font-semibold text-elite-text">Payment Successful</h1>
          <p className="mt-2 text-sm text-royal-gold">Your Vivahaa Elite profile has been created.</p>
          <p className="mt-4 text-sm text-elite-muted">
            We&apos;ve sent your login details to your email (and phone, if provided). Taking you to
            sign in…
          </p>
          <Button type="button" variant="elite" className="mt-6 w-full" onClick={() => onSuccess?.()}>
            Continue to Login <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    )
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
          {/* Plain, unconditionally-dark panels here — not <GlassCard>, whose
              background follows the OS/browser's light/dark preference (light ivory
              by default) while this wizard's text is hardcoded to the dark elite
              palette. That mismatch made both boxes below nearly unreadable on a
              light-preference system. See the same fix already applied to Input/
              Combobox/<select> options for the full pattern. */}
          <div className="rounded-3xl border border-royal-gold/20 bg-white/5 p-5 shadow-[0_0_40px_rgba(212,175,55,0.12)] backdrop-blur-xl">
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

            {/* 5-node stepper */}
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  title={stepTitles[step]}
                  aria-label={`Step ${index + 1}: ${stepTitles[step]}`}
                  aria-current={index === stepIndex ? 'step' : undefined}
                  onClick={() => index < stepIndex && setStepIndex(index)}
                  disabled={index > stepIndex}
                  className="group flex flex-1 flex-col items-center gap-1.5 py-1"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] transition-all duration-300 ${
                      index === stepIndex
                        ? 'bg-royal-gold text-elite-bg'
                        : index < stepIndex
                          ? 'bg-royal-gold/30 text-royal-gold'
                          : 'bg-white/10 text-elite-muted'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`h-[2px] w-full transition-all duration-500 ${
                      index <= stepIndex ? 'bg-royal-gold/60' : 'bg-white/10'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-royal-gold/20 bg-white/5 p-5 backdrop-blur-xl">
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
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[28px] border border-royal-gold/20 bg-white/5 p-4 backdrop-blur-xl sm:p-6"
            >
              <Suspense fallback={<StepSkeleton />}>
              <FormToneProvider tone="elite">
                {currentStep === 'basicContact' && (
                  <Step1BasicContact register={register} errors={errors} fieldErrors={fieldErrors} values={values} set={set} />
                )}
                {currentStep === 'communityBackground' && (
                  <Step2CommunityBackground register={register} errors={errors} fieldErrors={fieldErrors} values={values} set={set} />
                )}
                {currentStep === 'educationCareerFamily' && (
                  <Step3EducationCareerFamily register={register} errors={errors} fieldErrors={fieldErrors} values={values} set={set} />
                )}
                {currentStep === 'assetsPhotosPartner' && (
                  <Step4AssetsPhotosPartner register={register} errors={errors} fieldErrors={fieldErrors} values={values} set={set} />
                )}
                {currentStep === 'membershipPayment' && (
                  <Step5MembershipPayment
                    register={register}
                    errors={errors}
                    fieldErrors={fieldErrors}
                    values={values}
                    set={set}
                    draftToken={draftToken}
                    onPaid={handlePaid}
                  />
                )}
              </FormToneProvider>
              </Suspense>
            </motion.div>
          </AnimatePresence>

          {submitError && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {submitError}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={prevStep} disabled={stepIndex === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            <div className="flex flex-wrap items-center gap-3">
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                  <Check className="h-3.5 w-3.5" /> Section saved
                </span>
              )}
              {saveStatus === 'incomplete' && (
                <span className="text-xs font-medium text-red-500">Fill the required fields to save</span>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveStep}
                disabled={!stepIsFilled || saveStatus === 'checking'}
              >
                {saveStatus === 'checking' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save section
                  </>
                )}
              </Button>
              {currentStep !== 'membershipPayment' && (
                <Button type="button" variant="elite" onClick={nextStep}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

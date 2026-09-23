import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { RegisterFormValues } from '../registrationSchema'

// This panel is always dark (bg-elite-bg, unconditionally) regardless of the
// browser's light/dark preference, so text here must NOT use the std/elite
// dark: pairing — that pairing only resolves correctly when a surrounding
// background flips with it (as Input/Combobox's own backgrounds do). A plain
// dark: prefix here would leave `text-std-text` (near-black) showing on this
// near-black panel for anyone without OS-level dark mode on.
export const selectClass =
  'w-full rounded-xl border border-royal-gold/20 bg-white/10 px-4 py-3 text-sm text-elite-text'

export const labelClass =
  'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-elite-muted'

/** Shared prop shape every step component receives from RegistrationWizard. */
export interface StepProps {
  register: UseFormRegister<RegisterFormValues>
  errors: FieldErrors<RegisterFormValues>
  fieldErrors: Record<string, string | undefined>
  values: RegisterFormValues
  set: (field: string, value: unknown) => void
}

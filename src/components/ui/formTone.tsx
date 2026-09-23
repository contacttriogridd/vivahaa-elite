import React, { createContext, useContext, type ReactNode } from 'react'

/**
 * Lets a form field (Input, Combobox) know it's sitting on a panel that is dark
 * *unconditionally* rather than via Tailwind's `dark:` variant (which follows the
 * OS/browser's prefers-color-scheme, not this app's own theme toggle).
 *
 * The registration wizard is the motivating case: its outer panel is hard-coded to
 * `bg-elite-bg` regardless of OS preference (see the note in RegistrationWizard.tsx),
 * but Input/Combobox's own colors used to rely on `dark:` — so on a light-preference
 * OS, those fields rendered with their light-mode white background and near-black text
 * while sitting on the wizard's near-black panel: a washed-out, low-contrast field.
 *
 * `tone="elite"` makes a field use the always-dark elite palette unconditionally, with
 * no dependency on OS preference. Default ("auto") is completely unchanged from
 * before — every other page keeps following `dark:` exactly as it did.
 */
export type FormTone = 'auto' | 'elite'

const FormToneContext = createContext<FormTone>('auto')

export function FormToneProvider({ tone, children }: { tone: FormTone; children: ReactNode }) {
  return <FormToneContext.Provider value={tone}>{children}</FormToneContext.Provider>
}

export const useFormTone = () => useContext(FormToneContext)

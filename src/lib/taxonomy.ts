import casteTaxonomy from '../data/taxonomy/casteTaxonomy.json'
import konguKulams from '../data/taxonomy/konguKulams.json'

export interface TaxonomyOption {
  id: string
  label: string
}

interface SubcasteRecord {
  id: string
  label: string
}

interface CasteRecord {
  id: string
  label: string
  subcastes?: SubcasteRecord[]
  kulamModule?: string
}

interface ReligionRecord {
  id: string
  label: string
  castes?: CasteRecord[]
  skipsCaste?: boolean
}

const religions = casteTaxonomy.religions as ReligionRecord[]

/**
 * While a taxonomy file is unverified its comboboxes stay permissive: the user may
 * type a value that is not in the list rather than being blocked by a gap in our
 * seed data. Flipping `meta.verified` to true in the JSON makes them strict.
 */
export const casteTaxonomyVerified = casteTaxonomy.meta.verified === true
export const konguKulamsVerified = konguKulams.meta.verified === true

const toOption = (record: { id: string; label?: string; name?: string }): TaxonomyOption => ({
  id: record.id,
  label: record.label ?? record.name ?? record.id,
})

export const getReligions = (): TaxonomyOption[] => religions.map(toOption)

const findReligion = (religionId: string) => religions.find((r) => r.id === religionId)

const findCaste = (religionId: string, casteId: string) =>
  findReligion(religionId)?.castes?.find((c) => c.id === casteId)

export const getCastes = (religionId: string): TaxonomyOption[] =>
  (findReligion(religionId)?.castes ?? []).map(toOption)

export const getSubcastes = (religionId: string, casteId: string): TaxonomyOption[] =>
  (findCaste(religionId, casteId)?.subcastes ?? []).map(toOption)

/** Religions such as "Inter-religion / No preference" that make a caste question meaningless. */
export const religionSkipsCaste = (religionId: string): boolean =>
  findReligion(religionId)?.skipsCaste === true

/**
 * The single gate for the Kongu Vellalar Gounder kulam section.
 *
 * Gating reads the `kulamModule` key off the taxonomy entry rather than string-matching
 * a label, so renaming the display label cannot silently switch the section off. This is
 * the only caste-specific rule in the form — see src/pages/register/KonguKulamField.tsx.
 */
export const casteUsesKonguKulam = (religionId: string, casteId: string): boolean =>
  findCaste(religionId, casteId)?.kulamModule === 'kongu'

export const getKonguKulams = (): TaxonomyOption[] =>
  (konguKulams.kulams as { id: string; name: string; tamil?: string }[]).map((k) => ({
    id: k.id,
    label: k.tamil ? `${k.name} (${k.tamil})` : k.name,
  }))

/** Resolve a stored id back to its display label, for the review step and profile views. */
export const labelForReligion = (religionId: string): string =>
  findReligion(religionId)?.label ?? religionId

export const labelForCaste = (religionId: string, casteId: string): string =>
  findCaste(religionId, casteId)?.label ?? casteId

export const labelForSubcaste = (religionId: string, casteId: string, subcasteId: string): string =>
  findCaste(religionId, casteId)?.subcastes?.find((s) => s.id === subcasteId)?.label ?? subcasteId

export const labelForKulam = (kulamId: string): string =>
  getKonguKulams().find((k) => k.id === kulamId)?.label ?? kulamId

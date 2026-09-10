import React from 'react'
import { Combobox } from '../../components/ui/combobox'
import { KonguKulamField } from './KonguKulamField'
import {
  casteTaxonomyVerified,
  casteUsesKonguKulam,
  getCastes,
  getReligions,
  getSubcastes,
  religionSkipsCaste,
} from '../../lib/taxonomy'

interface CommunityFieldsProps {
  religion: string
  caste: string
  subcaste: string
  kulam: string
  onChange: (field: 'religion' | 'caste' | 'subcaste' | 'kulam', value: string) => void
  errors?: Partial<Record<'religion' | 'caste' | 'subcaste' | 'kulam', string>>
}

/**
 * Religion -> Caste -> Subcaste cascade. Each level filters the next, and changing a
 * level clears everything downstream so a stale child value can never be submitted
 * against a new parent.
 */
export function CommunityFields({
  religion,
  caste,
  subcaste,
  kulam,
  onChange,
  errors = {},
}: CommunityFieldsProps) {
  const castes = religion ? getCastes(religion) : []
  const subcastes = religion && caste ? getSubcastes(religion, caste) : []
  const casteNotApplicable = religion ? religionSkipsCaste(religion) : false
  const showKulam = Boolean(religion && caste) && casteUsesKonguKulam(religion, caste)

  const selectReligion = (value: string) => {
    onChange('religion', value)
    onChange('caste', '')
    onChange('subcaste', '')
    onChange('kulam', '')
  }

  const selectCaste = (value: string) => {
    onChange('caste', value)
    onChange('subcaste', '')
    // Leaving a Kongu-gated caste must not leave a kulam behind on the profile.
    if (!(religion && casteUsesKonguKulam(religion, value))) onChange('kulam', '')
  }

  return (
    <>
      <Combobox
        label="Religion"
        value={religion}
        onChange={selectReligion}
        options={getReligions()}
        error={errors.religion}
        placeholder="Select your religion"
      />

      <Combobox
        label="Caste"
        value={caste}
        onChange={selectCaste}
        options={castes}
        error={errors.caste}
        disabled={!religion || casteNotApplicable}
        allowCustom={!casteTaxonomyVerified}
        placeholder={
          !religion
            ? 'Select a religion first'
            : casteNotApplicable
              ? 'Not applicable'
              : 'Select or type to search'
        }
        emptyMessage={
          casteTaxonomyVerified
            ? 'No castes listed for this religion'
            : 'Our list for this religion is still being compiled — type yours in'
        }
        helperText={
          religion && !casteNotApplicable && castes.length === 0
            ? 'Type your caste and we’ll record it.'
            : undefined
        }
      />

      <Combobox
        label="Subcaste"
        value={subcaste}
        onChange={(value) => onChange('subcaste', value)}
        options={subcastes}
        error={errors.subcaste}
        disabled={!caste || casteNotApplicable}
        allowCustom={!casteTaxonomyVerified}
        placeholder={!caste ? 'Select a caste first' : 'Optional'}
        emptyMessage="No subcastes listed — type yours in, or leave blank"
      />

      {showKulam && (
        <KonguKulamField
          value={kulam}
          onChange={(value) => onChange('kulam', value)}
          error={errors.kulam}
        />
      )}
    </>
  )
}

import React from 'react'
import { Input } from '../../../components/ui/input'
import { AssetDetailsStep } from '../AssetDetailsStep'
import { PhotoUploadField } from '../PhotoUploadField'
import type { StepProps } from './shared'

/** Step 4 of 5 — Asset value bracket, photo upload, and partner preferences. */
export function Step4AssetsPhotosPartner({ register, errors, fieldErrors, values, set }: StepProps) {
  return (
    <div className="space-y-6">
      <AssetDetailsStep
        totalAssetValue={values.totalAssetValue}
        onChange={set}
        error={fieldErrors.totalAssetValue}
      />

      <div className="border-t border-white/10 pt-5">
        <PhotoUploadField value={values.photoDataUrl ?? ''} onChange={(dataUrl) => set('photoDataUrl', dataUrl)} />
      </div>

      <div className="border-t border-white/10 pt-5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-royal-gold">
          Partner Preferences
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Preferred Age" error={errors.partnerAge?.message} {...register('partnerAge')} />
          <Input label="Preferred Religion" error={errors.partnerReligion?.message} {...register('partnerReligion')} />
          <Input label="Preferred Location" error={errors.partnerLocation?.message} {...register('partnerLocation')} />
        </div>
      </div>
    </div>
  )
}

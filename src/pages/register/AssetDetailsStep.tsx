import React from 'react'
import { Lock } from 'lucide-react'
import { ASSET_VALUE_RANGES } from './registrationSchema'

/**
 * Deliberately one question. No itemised property, vehicle, or gold fields — an
 * inventory of someone's possessions reads as invasive and invites inflation. If
 * anyone proposes adding line items here, that is the reason not to.
 */
export function AssetDetailsStep({
  totalAssetValue,
  onChange,
  error,
}: {
  totalAssetValue: string
  onChange: (field: string, value: unknown) => void
  error?: string
}) {
  return (
    <div className="max-w-xl space-y-4">
      <div>
        <p className="font-playfair text-xl text-elite-text">
          Total asset value
        </p>
        <p className="mt-1 text-sm text-elite-muted">
          A broad range is all we ask for, and all we will ever show.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {ASSET_VALUE_RANGES.map((range) => {
          const selected = totalAssetValue === range
          return (
            <button
              key={range}
              type="button"
              onClick={() => onChange('totalAssetValue', range)}
              aria-pressed={selected}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                selected
                  ? 'border-royal-gold bg-royal-gold/10 text-royal-gold'
                  : 'border-royal-gold/20 bg-white/5 text-elite-text hover:border-royal-gold/40'
              }`}
            >
              {range}
            </button>
          )
        })}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-elite-muted">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal-gold" aria-hidden />
        <span>
          Private by default. Your range is not shown on your public profile unless you turn
          it on in your privacy settings.
        </span>
      </p>
    </div>
  )
}

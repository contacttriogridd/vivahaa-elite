import React from 'react'
import { ShieldCheck } from 'lucide-react'
import type { DashboardTheme } from '../../lib/dashboardTheme'

export interface MiniProfile {
  id: string
  name: string | null
  age: number | null
  city: string | null
  religion: string | null
  caste: string | null
  occupation: string | null
  idVerified?: boolean
  photoVerified?: boolean
  videoVerified?: boolean
  compatibilityScore?: number
}

/**
 * Compact card shared by every "list of other members" section (Likes, Views,
 * Passed, Best Match) — BrowseProfiles.tsx keeps its own richer grid card since it
 * has filters/pagination baked in, but the layout is the same shape, just smaller.
 */
export function MiniProfileCard({
  profile: p, theme: t, meta, actions,
}: {
  profile: MiniProfile
  theme: DashboardTheme
  meta?: string
  actions?: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl p-4 ${t.card}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-cormorant text-lg ${t.text}`}>{p.name ?? 'Member'}</p>
          <p className={`text-xs ${t.muted}`}>{[p.age ? `${p.age} yrs` : null, p.city].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex items-center gap-2">
          {typeof p.compatibilityScore === 'number' && (
            <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${t.badgePill}`}>
              {p.compatibilityScore}% match
            </span>
          )}
          {(p.idVerified || p.photoVerified || p.videoVerified) && (
            <ShieldCheck className={`h-4 w-4 shrink-0 ${t.accentText}`} aria-label="Verified" />
          )}
        </div>
      </div>
      <p className={`mt-1 text-xs ${t.muted}`}>{[p.religion, p.caste].filter(Boolean).join(' · ')}</p>
      {p.occupation && <p className={`mt-1 text-xs ${t.muted}`}>{p.occupation}</p>}
      {meta && <p className={`mt-2 font-mono text-[10px] uppercase tracking-[0.08em] ${t.accentText}`}>{meta}</p>}
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

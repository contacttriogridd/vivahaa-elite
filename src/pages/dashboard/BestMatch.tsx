import React, { useEffect, useState } from 'react'
import API from '../../lib/api'
import { AIMatchDisclaimer } from '../../components/dashboard/AIMatchDisclaimer'
import { MiniProfileCard, type MiniProfile } from '../../components/dashboard/MiniProfileCard'
import type { DashboardTheme } from '../../lib/dashboardTheme'

/**
 * Task 3.5: AI-generated best-match suggestions from horoscope + preference overlap.
 * The disclaimer is rendered unconditionally above the results, every time this
 * section is viewed — not a one-time dismissible notice — per the compliance
 * requirement that this never be presented as an astrologer's determination.
 */
export function BestMatch({ theme: t }: { theme: DashboardTheme }) {
  const [suggestions, setSuggestions] = useState<MiniProfile[]>([])
  const [disclaimer, setDisclaimer] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/matches/best-ai').then(({ data }) => {
      setSuggestions(data.suggestions)
      setDisclaimer(data.disclaimer)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {disclaimer && <AIMatchDisclaimer theme={t} text={disclaimer} />}

      {loading && <p className={`text-sm ${t.muted}`}>Finding your best matches…</p>}

      {!loading && suggestions.length === 0 && (
        <div className={`rounded-2xl p-10 text-center ${t.card}`}>
          <p className={`text-sm ${t.muted}`}>
            Add your nakshatra, rashi, and partner preferences to your profile to get AI best-match suggestions.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((p) => (
          <MiniProfileCard key={p.id} profile={p} theme={t} />
        ))}
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import API from '../../lib/api'
import { MiniProfileCard, type MiniProfile } from '../../components/dashboard/MiniProfileCard'
import type { DashboardTheme } from '../../lib/dashboardTheme'

/** Task 3.5: profiles this member explicitly passed on — excluded from their own future browse results (see GET /api/profiles). */
export function PassedProfiles({ theme: t }: { theme: DashboardTheme }) {
  const [profiles, setProfiles] = useState<(MiniProfile & { passedAt: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/passes').then(({ data }) => setProfiles(data.profiles)).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className={`text-sm ${t.muted}`}>Loading…</p>

  if (profiles.length === 0) {
    return (
      <div className={`rounded-2xl p-10 text-center ${t.card}`}>
        <p className={`text-sm ${t.muted}`}>You haven't passed on any profiles yet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((p) => (
        <MiniProfileCard key={p.id} profile={p} theme={t} meta={`Passed ${new Date(p.passedAt).toLocaleDateString('en-IN')}`} />
      ))}
    </div>
  )
}

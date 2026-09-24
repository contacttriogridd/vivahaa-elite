import React, { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import API from '../../lib/api'
import { MiniProfileCard, type MiniProfile } from '../../components/dashboard/MiniProfileCard'
import type { DashboardTheme } from '../../lib/dashboardTheme'

/**
 * Task 3.5: "who viewed me" is an Elite-only perk (see GET /api/profile-views/received's
 * 403 for a Standard member — this component's own tier check is only a courtesy so
 * a Standard member never even sees the tab fire a failing request; the real gate is
 * server-side). "Profiles I viewed" is available to both tiers — it's this member's
 * own browsing history.
 */
export function ProfileViews({ theme: t }: { theme: DashboardTheme }) {
  const [tab, setTab] = useState<'received' | 'made'>(t.isElite ? 'received' : 'made')
  const [received, setReceived] = useState<(MiniProfile & { viewedAt: string })[]>([])
  const [made, setMade] = useState<(MiniProfile & { viewedAt: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const calls = [API.get('/profile-views/made')]
    if (t.isElite) calls.push(API.get('/profile-views/received'))
    Promise.all(calls).then(([made_, received_]) => {
      setMade(made_.data.profiles)
      if (received_) setReceived(received_.data.profiles)
    }).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.isElite])

  const list = tab === 'received' ? received : made

  return (
    <div className="space-y-6">
      <div className="flex gap-1">
        <button
          onClick={() => setTab('received')}
          disabled={!t.isElite}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors disabled:opacity-40 ${
            tab === 'received' ? `${t.badgePill} border` : `${t.muted} border border-transparent`
          }`}
        >
          {!t.isElite && <Lock className="h-3 w-3" />} Who Viewed Me
        </button>
        <button
          onClick={() => setTab('made')}
          className={`rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
            tab === 'made' ? `${t.badgePill} border` : `${t.muted} border border-transparent`
          }`}
        >
          Profiles I Viewed
        </button>
      </div>

      {tab === 'received' && !t.isElite && (
        <div className={`rounded-2xl p-6 ${t.card}`}>
          <p className={`text-sm ${t.muted}`}>Seeing who viewed your profile is an Elite feature. Upgrade to unlock it.</p>
        </div>
      )}

      {loading && <p className={`text-sm ${t.muted}`}>Loading…</p>}

      {!loading && (tab === 'made' || t.isElite) && list.length === 0 && (
        <div className={`rounded-2xl p-10 text-center ${t.card}`}>
          <p className={`text-sm ${t.muted}`}>
            {tab === 'received' ? 'No one has viewed your profile yet.' : "You haven't viewed any profiles yet."}
          </p>
        </div>
      )}

      {(tab === 'made' || t.isElite) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <MiniProfileCard key={`${p.id}-${p.viewedAt}`} profile={p} theme={t} meta={new Date(p.viewedAt).toLocaleString('en-IN')} />
          ))}
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import API from '../../lib/api'
import { Button } from '../../components/ui/button'
import { MiniProfileCard, type MiniProfile } from '../../components/dashboard/MiniProfileCard'
import type { DashboardTheme } from '../../lib/dashboardTheme'

/**
 * Task 3.5: two clearly separated lists — profiles this member liked, and profiles
 * that liked this member — never merged into one feed. Liking someone back from the
 * "liked me" list can turn that pairing into a mutual Match (see Matches.tsx for
 * where chat then unlocks).
 */
export function Likes({ theme: t }: { theme: DashboardTheme }) {
  const [tab, setTab] = useState<'sent' | 'received'>('received')
  const [sent, setSent] = useState<(MiniProfile & { likedAt: string })[]>([])
  const [received, setReceived] = useState<(MiniProfile & { likedAt: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([API.get('/likes/sent'), API.get('/likes/received')])
      .then(([s, r]) => { setSent(s.data.profiles); setReceived(r.data.profiles) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const likeBack = async (id: string) => {
    setBusyId(id)
    try {
      const { data } = await API.post(`/likes/${id}`)
      if (data.matched) window.alert("It's a match! You can now chat from the Matches tab.")
      load()
    } finally {
      setBusyId(null)
    }
  }

  const list = tab === 'sent' ? sent : received
  const alreadyLikedIds = new Set(sent.map((p) => p.id))

  return (
    <div className="space-y-6">
      <div className="flex gap-1">
        {(['received', 'sent'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
              tab === key ? `${t.badgePill} border` : `${t.muted} border border-transparent`
            }`}
          >
            {key === 'received' ? `Liked Me (${received.length})` : `Liked By Me (${sent.length})`}
          </button>
        ))}
      </div>

      {loading && <p className={`text-sm ${t.muted}`}>Loading…</p>}

      {!loading && list.length === 0 && (
        <div className={`rounded-2xl p-10 text-center ${t.card}`}>
          <p className={`text-sm ${t.muted}`}>
            {tab === 'received' ? "No one has liked your profile yet." : "You haven't liked anyone yet — browse profiles to get started."}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <MiniProfileCard
            key={p.id}
            profile={p}
            theme={t}
            meta={new Date(p.likedAt).toLocaleDateString('en-IN')}
            actions={
              tab === 'received' && !alreadyLikedIds.has(p.id) ? (
                <Button size="sm" disabled={busyId === p.id} onClick={() => void likeBack(p.id)}>
                  {busyId === p.id ? 'Liking…' : 'Like Back'}
                </Button>
              ) : tab === 'received' ? (
                <span className={`font-mono text-[10px] uppercase ${t.accentText}`}>It's a match!</span>
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}

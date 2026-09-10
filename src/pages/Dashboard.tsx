import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { GlassCard } from '../components/ui/card'
import { planByTier } from '../lib/plans'

/**
 * The real, API-driven dashboard — replaces the mock-data-only src/Dashboard.jsx for
 * signed-in users. Deliberately plain for now: profile summary and a completion
 * readout only. Per-tier theming (Phase 4), browse/filter (Phase 5), and likes/
 * messaging (Phase 9) all layer on top of this shell rather than landing at once.
 *
 * Reads `useAuth().user` directly — AuthProvider already fetches the full profile
 * from GET /api/auth/profile on mount, so this component never issues its own
 * duplicate request.
 */
export default function Dashboard() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-std-bg">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-std-muted">Loading your profile…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-std-bg px-6">
        <p className="text-center text-sm text-std-muted">
          Your session has expired. Please sign in again.
        </p>
      </div>
    )
  }

  const plan = planByTier(user.plan)
  const completion = user.profileCompletion ?? 0

  const summaryFields: [string, string | null | undefined][] = [
    ['Religion', user.religion],
    ['Caste', user.caste],
    ['Kulam / Koottam', user.kulam],
    ['Mother Tongue', user.motherTongue],
    ['Height', user.height],
    ['Weight', user.weight],
    ['Blood Group', user.bloodGroup],
    ['Qualification', user.education],
    ['Occupation', user.occupation],
    ['Location', user.city],
    ['Food Preference', user.foodPreference],
    ['Hobbies', user.hobbies],
    ['Languages Known', user.languagesKnown],
  ]

  return (
    <div className="min-h-screen bg-std-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-std-border pb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-std-gold">
              {plan?.group === 'elite' ? 'Elite Member' : 'Member'}
            </p>
            <h1 className="mt-1 font-cormorant text-3xl font-semibold text-std-primary">
              Welcome, {user.name ?? 'there'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-std-gold/40 bg-std-gold/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-std-primary">
              {plan?.name ?? user.plan}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Sign Out
            </Button>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <GlassCard className="p-6">
            <h2 className="font-playfair text-xl font-semibold text-std-text">Your Profile</h2>
            <p className="mt-1 text-sm text-std-muted">
              What you shared when you registered. Editing comes to a later update.
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {summaryFields
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-std-muted">{label}</dt>
                    <dd className="mt-1 text-sm text-std-text">{value}</dd>
                  </div>
                ))}
            </dl>

            {summaryFields.every(([, value]) => !value) && (
              <p className="mt-6 text-sm text-std-muted">
                No profile details yet — this fills in as you register.
              </p>
            )}
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="p-6">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-std-muted">
                Profile Completion
              </h2>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-std-border">
                <div
                  className="h-full rounded-full bg-std-gold transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
                />
              </div>
              <p className="mt-2 font-cormorant text-2xl text-std-primary">{completion}%</p>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-std-muted">Coming Soon</h2>
              <ul className="mt-3 space-y-2 text-sm text-std-muted">
                <li>Browse &amp; search profiles</li>
                <li>Likes and matches</li>
                <li>Messaging</li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}

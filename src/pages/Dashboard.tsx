import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { ParticleField } from '../components/ui/ParticleField'
import { EliteBadge } from '../components/ui/EliteBadge'
import { planByTier } from '../lib/plans'

/**
 * The real, API-driven dashboard — replaces the mock-data-only src/Dashboard.jsx
 * for signed-in users. Reads `useAuth().user` directly (AuthProvider already fetches
 * the full profile on mount, so this never issues a duplicate request).
 *
 * Theme is driven by `user.plan`, a real database value — not a client-side toggle.
 * The two branches below pick their classes explicitly in JS rather than leaning on
 * Tailwind's `dark:` variant: this app's `dark:` classes are keyed to the browser's
 * `prefers-color-scheme`, not to which tier a member is on, so mixing the two here
 * would reproduce the same kind of dark-on-dark contrast bug fixed in the
 * registration wizard. Two literal class sets, chosen once by `isElite`, is what
 * actually makes a real Standard/Elite member see a different theme.
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
  const isElite = plan?.group === 'elite'
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

  // ── Theme tokens, chosen once ──────────────────────────────────────────────
  const t = isElite
    ? {
        page: 'bg-elite-bg',
        heading: 'font-playfair text-elite-text',
        eyebrow: 'text-royal-gold',
        body: 'font-inter',
        card: 'border border-royal-gold/20 bg-elite-panel/90 backdrop-blur-xl',
        cardHeading: 'font-playfair text-elite-text',
        muted: 'text-elite-muted',
        text: 'text-elite-text',
        border: 'border-elite-border',
        accentBg: 'bg-royal-gold',
        accentText: 'text-royal-gold',
        badgePill: 'border-royal-gold/40 bg-royal-gold/10 text-royal-gold',
        track: 'bg-elite-border',
      }
    : {
        page: 'bg-std-bg',
        heading: 'font-cormorant text-std-primary',
        eyebrow: 'text-std-gold',
        body: 'font-inter',
        card: 'border border-std-border bg-white/80 backdrop-blur-sm',
        cardHeading: 'font-playfair text-std-text',
        muted: 'text-std-muted',
        text: 'text-std-text',
        border: 'border-std-border',
        accentBg: 'bg-std-gold',
        accentText: 'text-std-primary',
        badgePill: 'border-std-gold/40 bg-std-gold/10 text-std-primary',
        track: 'bg-std-border',
      }

  return (
    <div className={`relative min-h-screen overflow-hidden ${t.page} ${t.body} px-4 py-8 sm:px-6 lg:px-8`}>
      {isElite && <ParticleField particleCount={16} petalCount={4} />}

      <div className="relative z-10 mx-auto max-w-5xl">
        <header className={`flex flex-wrap items-center justify-between gap-4 border-b ${t.border} pb-6`}>
          <div>
            <p className={`font-mono text-[10px] uppercase tracking-[0.25em] ${t.eyebrow}`}>
              {isElite ? 'Elite Member' : 'Member'}
            </p>
            <h1 className={`mt-1 flex items-center gap-2 text-3xl font-semibold ${t.heading}`}>
              Welcome, {user.name ?? 'there'}
              {isElite && <EliteBadge className={`h-6 w-6 ${t.accentText}`} />}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] ${t.badgePill}`}>
              {plan?.name ?? user.plan}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Sign Out
            </Button>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className={`rounded-2xl p-6 ${t.card}`}>
            <h2 className={`text-xl font-semibold ${t.cardHeading}`}>Your Profile</h2>
            <p className={`mt-1 text-sm ${t.muted}`}>
              What you shared when you registered. Editing comes to a later update.
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {summaryFields
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className={`font-mono text-[10px] uppercase tracking-[0.1em] ${t.muted}`}>{label}</dt>
                    <dd className={`mt-1 text-sm ${t.text}`}>{value}</dd>
                  </div>
                ))}
            </dl>

            {summaryFields.every(([, value]) => !value) && (
              <p className={`mt-6 text-sm ${t.muted}`}>
                No profile details yet — this fills in as you register.
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className={`rounded-2xl p-6 ${t.card}`}>
              <h2 className={`font-mono text-[10px] uppercase tracking-[0.15em] ${t.muted}`}>
                Profile Completion
              </h2>
              <div className={`mt-3 h-2 overflow-hidden rounded-full ${t.track}`}>
                <div
                  className={`h-full rounded-full ${t.accentBg} transition-all duration-700`}
                  style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
                />
              </div>
              <p className={`mt-2 font-cormorant text-2xl ${t.accentText}`}>{completion}%</p>
            </div>

            <div className={`rounded-2xl p-6 ${t.card}`}>
              <h2 className={`font-mono text-[10px] uppercase tracking-[0.15em] ${t.muted}`}>Coming Soon</h2>
              <ul className={`mt-3 space-y-2 text-sm ${t.muted}`}>
                <li>Browse &amp; search profiles</li>
                <li>Likes and matches</li>
                <li>Messaging</li>
                {isElite && <li>Who viewed your profile</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

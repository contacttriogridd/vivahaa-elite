import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { ParticleField } from '../components/ui/ParticleField'
import { EliteBadge } from '../components/ui/EliteBadge'
import { planByTier } from '../lib/plans'
import { getDashboardTheme } from '../lib/dashboardTheme'
import { BrowseProfiles } from './dashboard/BrowseProfiles'
import { ProfileEdit } from './dashboard/ProfileEdit'
import { Likes } from './dashboard/Likes'
import { Matches } from './dashboard/Matches'
import { ProfileViews } from './dashboard/ProfileViews'
import { PassedProfiles } from './dashboard/PassedProfiles'
import { BestMatch } from './dashboard/BestMatch'

/**
 * The real, API-driven dashboard — replaces the mock-data-only src/Dashboard.jsx
 * for signed-in users. Reads `useAuth().user` directly (AuthProvider already fetches
 * the full profile on mount, so this never issues a duplicate request).
 *
 * Theme is driven by `user.plan`, a real database value — not a client-side toggle.
 * See src/lib/dashboardTheme.ts for why the two themes are literal class sets
 * rather than Tailwind's `dark:` variant.
 */
type Tab = 'profile' | 'edit' | 'browse' | 'likes' | 'matches' | 'views' | 'passed' | 'bestmatch'

const TAB_LABELS: Record<Tab, string> = {
  profile: 'Your Profile',
  edit: 'Edit Profile',
  browse: 'Browse Profiles',
  likes: 'Likes',
  matches: 'Matches & Chat',
  views: 'Profile Views',
  passed: 'Passed Profiles',
  bestmatch: 'AI Best Match',
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('profile')

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
  const t = getDashboardTheme(user.plan)
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
    <div className={`relative min-h-screen overflow-hidden ${t.page} ${t.body} px-4 py-8 sm:px-6 lg:px-8`}>
      {t.isElite && <ParticleField particleCount={16} petalCount={4} />}

      <div className="relative z-10 mx-auto max-w-5xl">
        <header className={`flex flex-wrap items-center justify-between gap-4 border-b ${t.border} pb-6`}>
          <div>
            <p className={`font-mono text-[10px] uppercase tracking-[0.25em] ${t.eyebrow}`}>
              {t.isElite ? 'Elite Member' : 'Member'}
            </p>
            <h1 className={`mt-1 flex items-center gap-2 text-3xl font-semibold ${t.heading}`}>
              Welcome, {user.name ?? 'there'}
              {t.isElite && <EliteBadge className={`h-6 w-6 ${t.accentText}`} />}
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

        <nav className="mt-6 flex flex-wrap gap-1">
          {(['profile', 'edit', 'browse', 'likes', 'matches', 'views', 'passed', 'bestmatch'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                tab === key ? `${t.badgePill} border` : `${t.muted} border border-transparent`
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === 'browse' && <BrowseProfiles theme={t} />}
          {tab === 'edit' && <ProfileEdit theme={t} />}
          {tab === 'likes' && <Likes theme={t} />}
          {tab === 'matches' && <Matches theme={t} />}
          {tab === 'views' && <ProfileViews theme={t} />}
          {tab === 'passed' && <PassedProfiles theme={t} />}
          {tab === 'bestmatch' && <BestMatch theme={t} />}

          {tab === 'profile' && (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className={`rounded-2xl p-6 ${t.card}`}>
                <h2 className={`text-xl font-semibold ${t.cardHeading}`}>Your Profile</h2>
                <p className={`mt-1 text-sm ${t.muted}`}>
                  What you shared when you registered. Head to the Edit Profile tab to make changes.
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
                  <h2 className={`font-mono text-[10px] uppercase tracking-[0.15em] ${t.muted}`}>Quick Links</h2>
                  <ul className={`mt-3 space-y-2 text-sm ${t.muted}`}>
                    <li>Likes and matches — see the Likes / Matches tabs</li>
                    <li>Messaging unlocks once you match with someone</li>
                    {t.isElite && <li>Who viewed your profile — see the Profile Views tab</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

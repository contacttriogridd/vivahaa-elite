import React, { useEffect, useState } from 'react'
import API from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { INCOME_BRACKETS } from '../../data/incomeBrackets.js'
import type { DashboardTheme } from '../../lib/dashboardTheme'
import type { User } from '../../types'

// Mirrors server/lib/profileEditLimit.js's EDITABLE_PROFILE_FIELDS exactly — this
// list IS the edit form's field set, so the two can't drift apart.
const FIELDS: { key: keyof User; label: string }[] = [
  { key: 'name', label: 'Full Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'city', label: 'City' },
  { key: 'education', label: 'Qualification' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'income', label: 'Annual Income' },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
  { key: 'bloodGroup', label: 'Blood Group' },
  { key: 'foodPreference', label: 'Food Preference' },
  { key: 'hobbies', label: 'Hobbies' },
  { key: 'lifestyleInterests', label: 'Lifestyle Interests' },
  { key: 'languagesKnown', label: 'Languages Known' },
  { key: 'familyType', label: 'Family Type' },
  { key: 'partnerAgeRange', label: 'Partner Age Range' },
  { key: 'partnerReligion', label: 'Partner Religion' },
  { key: 'partnerLocation', label: 'Partner Location' },
  { key: 'nakshatra', label: 'Nakshatra' },
  { key: 'rashi', label: 'Rashi' },
]

/**
 * Task 3.4: profile editing with the monthly cap. One "Save Changes" click, however
 * many of the fields above it touches, counts as exactly one edit — see
 * EDIT_COUNTS_AS in server/lib/profileEditLimit.js. A click that changes nothing
 * (values identical to what's already saved) does not consume a credit — the server
 * computes that diff itself, this form just reflects whatever it reports back.
 */
export function ProfileEdit({ theme: t }: { theme: DashboardTheme }) {
  const { user, setUser } = useAuth()
  const [values, setValues] = useState<Record<string, string>>({})
  const [incomeBracket, setIncomeBracket] = useState('')
  const [status, setStatus] = useState<{ used: number; remaining: number; limit: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return
    const initial: Record<string, string> = {}
    for (const f of FIELDS) initial[f.key as string] = (user[f.key] as string) ?? ''
    setValues(initial)
    setIncomeBracket(user.incomeBracket ?? '')
    API.get('/profile/edit-status').then(({ data }) => setStatus(data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }))

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const { data } = await API.patch('/profile', { ...values, incomeBracket })
      setUser(data.user)
      setStatus({ used: data.used, remaining: data.remaining, limit: data.limit })
      setMessage(data.changed ? 'Saved.' : 'No changes to save.')
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Could not save changes.')
      if (err?.response?.data) setStatus({ used: err.response.data.used, remaining: err.response.data.remaining, limit: err.response.data.limit })
    } finally {
      setSaving(false)
    }
  }

  const atLimit = status ? status.remaining <= 0 : false

  return (
    <div className={`rounded-2xl p-6 ${t.card}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-xl font-semibold ${t.cardHeading}`}>Edit Your Profile</h2>
        {status && (
          <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${t.badgePill}`}>
            {status.remaining} of {status.limit} edits left this month
          </span>
        )}
      </div>
      <p className={`mt-1 text-xs ${t.muted}`}>
        One save — however many fields you change in it — uses one edit credit. Credits reset on the 1st of each month.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <Input
            key={f.key as string}
            label={f.label}
            value={values[f.key as string] ?? ''}
            onChange={(e) => set(f.key as string, e.target.value)}
            disabled={atLimit}
          />
        ))}
        <div>
          <label className={`mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] ${t.muted}`}>Income Bracket</label>
          <select
            value={incomeBracket}
            onChange={(e) => setIncomeBracket(e.target.value)}
            disabled={atLimit}
            className={`w-full rounded-xl px-4 py-3 text-sm ${t.inputField}`}
          >
            <option value="">Not set</option>
            {INCOME_BRACKETS.map((b: string) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {message && <p className={`mt-4 text-sm ${atLimit ? 'text-red-500' : t.accentText}`}>{message}</p>}

      <div className="mt-6">
        <Button onClick={() => void save()} disabled={saving || atLimit}>
          {saving ? 'Saving…' : atLimit ? 'No edits remaining this month' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

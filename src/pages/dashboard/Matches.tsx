import React, { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import API from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import type { MiniProfile } from '../../components/dashboard/MiniProfileCard'
import type { DashboardTheme } from '../../lib/dashboardTheme'

interface MatchRow {
  matchId: string
  matchedAt: string
  profile: MiniProfile
  lastMessage: { body: string; createdAt: string } | null
}

interface Message {
  id: string
  matchId: string
  senderId: string
  body: string
  createdAt: string
}

/**
 * Task 3.5: chat only exists behind a mutual Match — there is no other way to
 * message a member on this platform (see POST /api/matches/:matchId/messages,
 * which 404s for any matchId the signed-in member isn't part of).
 */
export function Matches({ theme: t }: { theme: DashboardTheme }) {
  const { user } = useAuth()
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    API.get('/matches').then(({ data }) => {
      setMatches(data.matches)
      if (data.matches.length > 0) setActive(data.matches[0].matchId)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!active) return
    API.get(`/matches/${active}/messages`).then(({ data }) => setMessages(data.messages))
  }, [active])

  const send = async () => {
    if (!draft.trim() || !active) return
    setSending(true)
    try {
      const { data } = await API.post(`/matches/${active}/messages`, { body: draft.trim() })
      setMessages((prev) => [...prev, data.message])
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <p className={`text-sm ${t.muted}`}>Loading…</p>

  if (matches.length === 0) {
    return (
      <div className={`rounded-2xl p-10 text-center ${t.card}`}>
        <p className={`text-sm ${t.muted}`}>
          No matches yet. Chat unlocks once you and another member like each other — see the Likes tab.
        </p>
      </div>
    )
  }

  const activeMatch = matches.find((m) => m.matchId === active)

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className={`space-y-2 rounded-2xl p-3 ${t.card}`}>
        {matches.map((m) => (
          <button
            key={m.matchId}
            onClick={() => setActive(m.matchId)}
            className={`w-full rounded-xl p-3 text-left transition-colors ${
              active === m.matchId ? t.badgePill + ' border' : 'border border-transparent hover:bg-black/5'
            }`}
          >
            <p className={`font-cormorant text-base ${t.text}`}>{m.profile.name ?? 'Member'}</p>
            <p className={`truncate text-xs ${t.muted}`}>{m.lastMessage?.body ?? 'Say hello!'}</p>
          </button>
        ))}
      </div>

      <div className={`flex flex-col rounded-2xl p-4 ${t.card}`} style={{ minHeight: 420 }}>
        {activeMatch && (
          <p className={`border-b pb-3 font-cormorant text-lg ${t.text} ${t.border}`}>{activeMatch.profile.name}</p>
        )}
        <div className="flex-1 space-y-2 overflow-y-auto py-3">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
              m.senderId === user?.id ? `ml-auto ${t.accentBg} text-white` : `${t.track} ${t.text}`
            }`}>
              {m.body}
            </div>
          ))}
          {messages.length === 0 && <p className={`text-sm ${t.muted}`}>No messages yet — say hello!</p>}
        </div>
        <div className="flex gap-2 pt-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void send()}
            placeholder="Type a message…"
            className={`flex-1 rounded-xl px-4 py-2 text-sm ${t.inputField}`}
          />
          <button
            onClick={() => void send()}
            disabled={sending || !draft.trim()}
            className={`rounded-xl px-4 py-2 ${t.accentBg} text-white disabled:opacity-50`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

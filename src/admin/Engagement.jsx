import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ADMIN } from '../data.js'
import { adminApi } from './apiClient.js'
import { ABtn, ABadge, ATable, AInput, SearchBar, SectionHeader, GlassCard, GoldDivider, Toast } from './ui.jsx'

const A = ADMIN
const TIERS = ['SILVER', 'GOLD', 'DIAMOND', 'PLATINUM', 'PLATINUM_PLUS']

function EngagementDrawer({ user, onClose }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    adminApi.get(`/admin/engagement/${user.id}/suggestions`)
      .then(({ data }) => setSuggestions(data.suggestions))
      .finally(() => setLoading(false))
  }, [user.id])

  const sendSuggestion = async (targetUserId) => {
    try {
      await adminApi.post(`/admin/engagement/${user.id}/actions`, { type: 'match_suggestion', targetUserId })
      setToast({ message: 'Curated match sent to member', type: 'success' })
    } catch (e) {
      setToast({ message: e.response?.data?.message || 'Failed to send', type: 'error' })
    }
  }

  const logPrioritySupport = async () => {
    try {
      await adminApi.post(`/admin/engagement/${user.id}/actions`, { type: 'priority_support' })
      setToast({ message: 'Priority support logged for this member', type: 'success' })
    } catch (e) {
      setToast({ message: e.response?.data?.message || 'Failed to log', type: 'error' })
    }
  }

  const isElite = ['PLATINUM', 'PLATINUM_PLUS'].includes(user.plan)

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(480px, 100vw)', zIndex: 500, background: A.card, borderLeft: `1px solid ${A.borderGlow}`, boxShadow: '-20px 0 80px rgba(0,0,0,0.6)', overflowY: 'auto' }}
    >
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ padding: '1.5rem', borderBottom: `1px solid ${A.border}` }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', fontSize: 18, marginBottom: 16 }}>✕</button>
        <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', fontWeight: 700, color: A.text }}>{user.name}</h3>
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em' }}>{user.email} · {user.city || '—'}</p>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <ABadge color={A.gold}>{user.plan}</ABadge>
          {isElite && <ABadge color={A.purple} dot>Elite</ABadge>}
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: A.panel, borderRadius: 10, padding: 12, border: `1px solid ${A.border}` }}>
            <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', fontWeight: 700, color: A.cyan }}>{user._count.profileViewsMade}</p>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Profiles Viewed</p>
          </div>
          <div style={{ background: A.panel, borderRadius: 10, padding: 12, border: `1px solid ${A.border}` }}>
            <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', fontWeight: 700, color: A.red }}>{user._count.likesSent}</p>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Profiles Liked</p>
          </div>
        </div>

        {isElite && (
          <>
            <ABtn variant="purple" size="sm" onClick={logPrioritySupport} style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
              ★ Log Elite Priority Support Touch
            </ABtn>
          </>
        )}

        <GoldDivider />
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Best Match Suggestions
        </p>
        {loading && <p style={{ color: A.muted, fontSize: 13 }}>Scoring candidates…</p>}
        {!loading && suggestions.length === 0 && <p style={{ color: A.muted, fontStyle: 'italic', fontSize: 13 }}>No compatible candidates found right now.</p>}
        {suggestions.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${A.border}22` }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{s.name}</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>{s.city} · {s.religion || '—'} · match score {s.score}</p>
            </div>
            <ABtn size="sm" variant="outline" onClick={() => sendSuggestion(s.id)}>Send</ABtn>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Engagement() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      adminApi.get('/admin/engagement', { params: { search, tier, pageSize: 100 } })
        .then(({ data }) => { setUsers(data.users); setTotal(data.total) })
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [search, tier])

  const cols = [
    { key: 'name', label: 'Member', render: (v, row) => (
      <div>
        <p style={{ fontWeight: 600, color: A.text, fontSize: 13 }}>{v}</p>
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>{row.email}</p>
      </div>
    )},
    { key: 'city', label: 'City', render: (v) => <span style={{ color: A.muted, fontSize: 12 }}>{v || '—'}</span> },
    { key: 'plan', label: 'Tier', render: (v) => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'viewsCount', label: 'Profiles Viewed', render: (v, row) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: A.cyan }}>{row._count.profileViewsMade}</span> },
    { key: 'likesCount', label: 'Profiles Liked', render: (v, row) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: A.red }}>{row._count.likesSent}</span> },
  ]

  return (
    <div>
      <SectionHeader title="User Engagement" sub={`${total} member${total === 1 ? '' : 's'}`} />

      <GlassCard style={{ padding: '1rem 1.2rem', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search member name…" />
          <div style={{ minWidth: 150 }}><AInput label="Tier" value={tier} onChange={setTier} options={TIERS} /></div>
          <ABtn variant="ghost" size="sm" onClick={() => { setSearch(''); setTier('') }}>Clear</ABtn>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: '0.5rem 0' }}>
        {loading ? <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p> : <ATable columns={cols} rows={users} onRowClick={setSelected} />}
      </GlassCard>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 499 }} />
            <EngagementDrawer user={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

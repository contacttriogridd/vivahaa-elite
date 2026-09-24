import React, { useEffect, useState } from 'react'
import { ADMIN } from '../data.js'
import { dealerApi } from '../admin/apiClient.js'
import { ABadge, StatusBadge, ATable, SectionHeader, GlassCard, StatCard, ATabs, ABtn, AModal, Toast } from '../admin/ui.jsx'

const A = ADMIN

export default function DealerPortal({ dealer, onLogout }) {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [dealerCode, setDealerCode] = useState(dealer.dealerCode)
  const [reminders, setReminders] = useState({ users: [], reasonCatalog: {} })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Match tool state
  const [matchUser, setMatchUser] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      dealerApi.get('/dealer/users'),
      dealerApi.get('/dealer/reminders'),
    ]).then(([u, r]) => {
      setUsers(u.data.users)
      setDealerCode(u.data.dealerCode)
      setReminders(r.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const logout = async () => {
    try { await dealerApi.post('/dealer/logout') } catch { /* token may already be expired */ }
    localStorage.removeItem('dealerAccessToken')
    onLogout()
  }

  const openMatchTool = async (user) => {
    setMatchUser(user)
    setSuggestLoading(true)
    try {
      const { data } = await dealerApi.get(`/dealer/users/${user.id}/suggestions`)
      setSuggestions(data.suggestions)
    } catch {
      setSuggestions([])
    } finally {
      setSuggestLoading(false)
    }
  }

  const sendMatch = async (targetUserId) => {
    try {
      await dealerApi.post(`/dealer/users/${matchUser.id}/send-match`, { targetUserId })
      setToast({ message: 'Match sent', type: 'success' })
      setMatchUser(null)
    } catch (err) {
      setToast({ message: err?.response?.data?.message || 'Failed to send match', type: 'error' })
    }
  }

  const sendReminder = async (userId, reason) => {
    try {
      await dealerApi.post(`/dealer/reminders/${userId}/send`, { reason })
      setToast({ message: 'Reminder sent', type: 'success' })
      load()
    } catch (err) {
      setToast({ message: err?.response?.data?.message || 'Failed to send reminder', type: 'error' })
    }
  }

  const paidCount = users.filter((u) => u.feeStatus === 'paid').length

  const userCols = [
    { key: 'name', label: 'Name', render: (v, row) => <span style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{v || row.email}</span> },
    { key: 'plan', label: 'Tier', render: (v) => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'feeStatus', label: 'Payment', render: (v) => <StatusBadge status={v} /> },
    { key: 'city', label: 'City', render: (v) => <span style={{ fontSize: 12, color: A.muted }}>{v || '—'}</span> },
    {
      key: '_actions', label: '', render: (_, row) => (
        <ABtn size="sm" variant="outline" onClick={() => openMatchTool(row)}>Suggest Match</ABtn>
      ),
    },
  ]

  const reminderCols = [
    { key: 'name', label: 'Name', render: (v, row) => <span style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{v || row.email}</span> },
    {
      key: 'reasons', label: 'Reason', render: (v) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {v.map((r) => <ABadge key={r} color={r === 'unpaid' ? A.red : A.orange}>{reminders.reasonCatalog[r] || r}</ABadge>)}
        </div>
      ),
    },
    {
      key: '_actions', label: '', render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {row.reasons.map((r) => (
            <ABtn key={r} size="sm" variant="outline" onClick={() => sendReminder(row.id, r)}>
              Send: {reminders.reasonCatalog[r] || r}
            </ABtn>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className="admin-root" style={{ minHeight: '100vh', background: A.bg, color: A.text, padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.6rem', fontWeight: 700, color: A.gold }}>{dealer.name}</p>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em' }}>
            Promo code: {dealerCode} · Commission: {dealer.commissionPct}%
          </p>
        </div>
        <button onClick={logout} style={{ background: 'none', border: `1px solid ${A.border}`, borderRadius: 8, padding: '8px 16px', color: A.muted, cursor: 'pointer', fontFamily: 'Inter', fontSize: 12 }}>
          ⎋ Sign Out
        </button>
      </div>

      <SectionHeader title="Dealer Dashboard" sub="Members you onboarded, curated match suggestions, and reminder tools" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="👥" label="Onboarded Members" value={users.length} color={A.blue} />
        <StatCard icon="✓" label="Paid" value={paidCount} color={A.green} />
        <StatCard icon="⏳" label="Unpaid" value={users.length - paidCount} color={A.orange} />
        <StatCard icon="🔔" label="Reminders Due" value={reminders.users.length} color={A.red} />
      </div>

      <ATabs
        tabs={[
          { id: 'users', label: 'Onboarded Users', icon: '👥' },
          { id: 'reminders', label: 'Reminders', icon: '🔔' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading && <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p>}

      {!loading && tab === 'users' && (
        <GlassCard style={{ padding: '0.5rem 0' }}>
          {users.length === 0
            ? <p style={{ padding: '1.5rem', color: A.muted, fontStyle: 'italic' }}>No members onboarded with your promo code yet.</p>
            : <ATable columns={userCols} rows={users} />}
        </GlassCard>
      )}

      {!loading && tab === 'reminders' && (
        <GlassCard style={{ padding: '0.5rem 0' }}>
          {reminders.users.length === 0
            ? <p style={{ padding: '1.5rem', color: A.muted, fontStyle: 'italic' }}>No reminders due right now.</p>
            : <ATable columns={reminderCols} rows={reminders.users} />}
        </GlassCard>
      )}

      <AModal open={!!matchUser} onClose={() => setMatchUser(null)} title={matchUser ? `Same-tier matches for ${matchUser.name || matchUser.email}` : ''} width={560}>
        {suggestLoading && <p style={{ color: A.muted }}>Finding candidates…</p>}
        {!suggestLoading && suggestions.length === 0 && (
          <p style={{ color: A.muted, fontStyle: 'italic' }}>No same-tier candidates found for this member right now.</p>
        )}
        {!suggestLoading && suggestions.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${A.border}22` }}>
            <div>
              <p style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{s.name}</p>
              <p style={{ fontSize: 11, color: A.muted }}>{s.plan} · {s.city || '—'} · {s.religion || '—'}</p>
            </div>
            <ABtn size="sm" onClick={() => sendMatch(s.id)}>Send Match</ABtn>
          </div>
        ))}
      </AModal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

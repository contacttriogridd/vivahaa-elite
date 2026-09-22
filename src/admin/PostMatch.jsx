import React, { useEffect, useState } from 'react'
import { ADMIN } from '../data.js'
import { adminApi } from './apiClient.js'
import { ABadge, StatusBadge, SectionHeader, GlassCard, SearchBar } from './ui.jsx'

const A = ADMIN

export default function PostMatch() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    adminApi.get('/admin/post-match', { params: { pageSize: 100 } })
      .then(({ data }) => { setUsers(data.users); setTotal(data.total) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    : users

  return (
    <div>
      <SectionHeader title="Post-Match Services" sub={`${total} matched member${total === 1 ? '' : 's'}`} />

      <GlassCard style={{ padding: '1rem 1.2rem', marginBottom: 16 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search matched member…" />
      </GlassCard>

      {loading && <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p>}
      {!loading && filtered.length === 0 && (
        <GlassCard style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: A.muted, fontStyle: 'italic' }}>No matched members found.</p>
        </GlassCard>
      )}

      {!loading && filtered.map((u) => (
        <GlassCard key={u.id} style={{ padding: '1.2rem 1.4rem', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: u.bookings.length ? 12 : 0 }}>
            <div>
              <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.15rem', fontWeight: 700, color: A.text }}>{u.name}</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>{u.city || '—'}</p>
            </div>
            <ABadge color={A.gold}>{u.bookings.length} booking{u.bookings.length === 1 ? '' : 's'}</ABadge>
          </div>
          {u.bookings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {u.bookings.map((b) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: A.panel, borderRadius: 8, border: `1px solid ${A.border}` }}>
                  <span style={{ fontSize: 13, color: A.text, fontWeight: 500, flex: 1 }}>{b.serviceType}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muted }}>{b.vendor?.name} ({b.vendor?.vendorId})</span>
                  <StatusBadge status={b.status?.toLowerCase()} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  )
}

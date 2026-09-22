import React, { useEffect, useState } from 'react'
import { ADMIN } from '../data.js'
import { vendorApi } from '../admin/apiClient.js'
import { ABadge, StatusBadge, ATable, SectionHeader, GlassCard, StatCard, ATabs } from '../admin/ui.jsx'

const A = ADMIN

export default function VendorPortal({ vendor, onLogout }) {
  const [tab, setTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [ratings, setRatings] = useState({ ratings: [], average: 0, count: 0 })
  const [cancelled, setCancelled] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      vendorApi.get('/vendor/bookings'),
      vendorApi.get('/vendor/ratings'),
      vendorApi.get('/vendor/bookings/cancelled'),
    ]).then(([b, r, c]) => {
      setBookings(b.data.bookings)
      setRatings(r.data)
      setCancelled(c.data.bookings)
    }).finally(() => setLoading(false))
  }, [])

  const logout = async () => {
    try { await vendorApi.post('/vendor/logout') } catch { /* token may already be expired */ }
    localStorage.removeItem('vendorAccessToken')
    onLogout()
  }

  const upcoming = bookings.filter((b) => ['PENDING', 'CONFIRMED'].includes(b.status))
  const completed = bookings.filter((b) => b.status === 'COMPLETED')

  const bookingCols = [
    { key: 'user', label: 'Member', render: (v) => <span style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{v?.name}</span> },
    { key: 'serviceType', label: 'Service', render: (v) => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'scheduledDate', label: 'Date', render: (v) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muted }}>{v ? new Date(v).toLocaleDateString('en-IN') : '—'}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v?.toLowerCase()} /> },
  ]

  const cancelledCols = [
    { key: 'user', label: 'Member', render: (v) => <span style={{ fontSize: 13, color: A.text }}>{v?.name}</span> },
    { key: 'serviceType', label: 'Service', render: (v) => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'cancelledBy', label: 'Cancelled By', render: (v) => <ABadge color={A.red}>{v === 'USER' ? 'Member' : 'Vendor'}</ABadge> },
    { key: 'cancelReason', label: 'Reason', render: (v) => <span style={{ fontSize: 12, color: A.muted }}>{v || '—'}</span> },
  ]

  return (
    <div className="admin-root" style={{ minHeight: '100vh', background: A.bg, color: A.text, padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.6rem', fontWeight: 700, color: A.gold }}>{vendor.name}</p>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em' }}>{vendor.vendorId} · {vendor.category} · {vendor.city}</p>
        </div>
        <button onClick={logout} style={{ background: 'none', border: `1px solid ${A.border}`, borderRadius: 8, padding: '8px 16px', color: A.muted, cursor: 'pointer', fontFamily: 'Inter', fontSize: 12 }}>
          ⎋ Sign Out
        </button>
      </div>

      <SectionHeader title="Vendor Partner Dashboard" sub="Your bookings, ratings and cancellations — visible only to you" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="📅" label="Upcoming Bookings" value={upcoming.length} color={A.blue} />
        <StatCard icon="✓" label="Completed" value={completed.length} color={A.green} />
        <StatCard icon="⭐" label="Average Rating" value={`${ratings.average.toFixed(1)} (${ratings.count})`} color={A.orange} />
        <StatCard icon="⊘" label="Cancelled" value={cancelled.length} color={A.red} />
      </div>

      <ATabs
        tabs={[
          { id: 'bookings', label: 'Bookings', icon: '📅' },
          { id: 'ratings', label: 'Ratings & Reviews', icon: '⭐' },
          { id: 'cancelled', label: 'Cancelled', icon: '⊘' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading && <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p>}

      {!loading && tab === 'bookings' && (
        <GlassCard style={{ padding: '0.5rem 0' }}>
          <ATable columns={bookingCols} rows={bookings} />
        </GlassCard>
      )}

      {!loading && tab === 'ratings' && (
        <GlassCard style={{ padding: '1.2rem 1.4rem' }}>
          {ratings.ratings.length === 0 && <p style={{ color: A.muted, fontStyle: 'italic' }}>No ratings yet.</p>}
          {ratings.ratings.map((r) => (
            <div key={r.id} style={{ padding: '10px 0', borderBottom: `1px solid ${A.border}22` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{r.user?.name}</span>
                <span style={{ color: A.orange, fontSize: 13 }}>{'⭐'.repeat(r.rating)}</span>
              </div>
              {r.review && <p style={{ fontSize: 12, color: A.muted, marginTop: 4 }}>{r.review}</p>}
            </div>
          ))}
        </GlassCard>
      )}

      {!loading && tab === 'cancelled' && (
        <GlassCard style={{ padding: '0.5rem 0' }}>
          <ATable columns={cancelledCols} rows={cancelled} />
        </GlassCard>
      )}
    </div>
  )
}

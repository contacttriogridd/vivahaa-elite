import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ADMIN } from '../data.js'
import { vendorApi } from '../admin/apiClient.js'
import { ABadge, StatusBadge, ATable, SectionHeader, GlassCard, StatCard, ATabs, ABtn, Toast } from '../admin/ui.jsx'

const A = ADMIN

export default function VendorPortal({ vendor, onLogout }) {
  const [tab, setTab] = useState('category')
  const [orders, setOrders] = useState({ completed: [], ongoing: [], rejected: [], underValuation: [], counts: {} })
  const [earnings, setEarnings] = useState({ totalEarnings: 0, paidBookingsCount: 0, rejected: [] })
  const [ratings, setRatings] = useState({ ratings: [], average: 0, count: 0 })
  const [category, setCategory] = useState(null)
  const [stats, setStats] = useState({ series: [] })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      vendorApi.get('/vendor/orders'),
      vendorApi.get('/vendor/earnings'),
      vendorApi.get('/vendor/ratings'),
      vendorApi.get('/vendor/category'),
      vendorApi.get('/vendor/stats'),
    ]).then(([o, e, r, c, s]) => {
      setOrders(o.data)
      setEarnings(e.data)
      setRatings(r.data)
      setCategory(c.data)
      setStats(s.data)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const logout = async () => {
    try { await vendorApi.post('/vendor/logout') } catch { /* token may already be expired */ }
    localStorage.removeItem('vendorAccessToken')
    onLogout()
  }

  const resolveEnquiry = async (id, decision) => {
    try {
      await vendorApi.patch(`/vendor/enquiries/${id}`, { decision })
      setToast({ message: decision === 'accept' ? 'Enquiry accepted' : 'Enquiry declined', type: 'success' })
      load()
    } catch (err) {
      setToast({ message: err?.response?.data?.message || 'Failed to update enquiry', type: 'error' })
    }
  }

  const orderCols = [
    { key: 'user', label: 'Member', render: (v) => <span style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{v?.name}</span> },
    { key: 'serviceType', label: 'Service', render: (v) => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'scheduledDate', label: 'Date', render: (v) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muted }}>{v ? new Date(v).toLocaleDateString('en-IN') : '—'}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v?.toLowerCase()} /> },
  ]

  // Booking shape (orders.rejected): cancelledBy/cancelReason.
  const rejectedCols = [
    { key: 'user', label: 'Member', render: (v) => <span style={{ fontSize: 13, color: A.text }}>{v?.name}</span> },
    { key: 'serviceType', label: 'Service', render: (v) => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'cancelledBy', label: 'Rejected By', render: (v) => <ABadge color={A.red}>{v === 'USER' ? 'Member' : 'Vendor'}</ABadge> },
    { key: 'cancelReason', label: 'Reason', render: (v) => <span style={{ fontSize: 12, color: A.muted }}>{v || '—'}</span> },
  ]

  // GET /api/vendor/earnings's rejected list has a different shape (rejectedBy/reason)
  // than a raw Booking — its own columns, not a reuse of rejectedCols above.
  const earningsRejectedCols = [
    { key: 'user', label: 'Member', render: (v) => <span style={{ fontSize: 13, color: A.text }}>{v?.name}</span> },
    { key: 'serviceType', label: 'Service', render: (v) => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'rejectedBy', label: 'Rejected By', render: (v) => <ABadge color={A.red}>{v === 'USER' ? 'Member' : 'Vendor'}</ABadge> },
    { key: 'reason', label: 'Reason', render: (v) => <span style={{ fontSize: 12, color: A.muted }}>{v || '—'}</span> },
  ]

  const valuationCols = [
    { key: 'user', label: 'Member', render: (v) => <span style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{v?.name}</span> },
    { key: 'message', label: 'Enquiry', render: (v) => <span style={{ fontSize: 12, color: A.muted }}>{v || '—'}</span> },
    { key: 'createdAt', label: 'Received', render: (v) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muted }}>{new Date(v).toLocaleDateString('en-IN')}</span> },
    {
      key: '_actions', label: '', render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <ABtn size="sm" variant="success" onClick={() => resolveEnquiry(row.id, 'accept')}>Accept</ABtn>
          <ABtn size="sm" variant="danger" onClick={() => resolveEnquiry(row.id, 'decline')}>Decline</ABtn>
        </div>
      ),
    },
  ]

  return (
    <div className="admin-root" style={{ minHeight: '100vh', background: A.bg, color: A.text, padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.6rem', fontWeight: 700, color: A.gold }}>{vendor.name}</p>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em' }}>{vendor.vendorId} · {category?.family?.label || vendor.category} · {vendor.city}</p>
        </div>
        <button onClick={logout} style={{ background: 'none', border: `1px solid ${A.border}`, borderRadius: 8, padding: '8px 16px', color: A.muted, cursor: 'pointer', fontFamily: 'Inter', fontSize: 12 }}>
          ⎋ Sign Out
        </button>
      </div>

      <SectionHeader title="Vendor Partner Dashboard" sub="Your bookings, earnings and ratings — visible only to you" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="✓" label="Completed" value={orders.counts?.completed ?? 0} color={A.green} />
        <StatCard icon="⏱" label="Ongoing" value={orders.counts?.ongoing ?? 0} color={A.blue} />
        <StatCard icon="⊘" label="Rejected" value={orders.counts?.rejected ?? 0} color={A.red} />
        <StatCard icon="❓" label="Under Valuation" value={orders.counts?.underValuation ?? 0} color={A.orange} />
        <StatCard icon="₹" label="Total Earnings" value={`₹${Number(earnings.totalEarnings || 0).toLocaleString('en-IN')}`} color={A.gold} />
        <StatCard icon="⭐" label="Average Rating" value={`${ratings.average.toFixed(1)} (${ratings.count})`} color={A.purple} />
      </div>

      <ATabs
        tabs={[
          { id: 'category', label: 'Profile & Category Info', icon: '🪪' },
          { id: 'orders', label: 'Bookings', icon: '📅' },
          { id: 'earnings', label: 'Earnings', icon: '₹' },
          { id: 'ratings', label: 'Ratings & Feedback', icon: '⭐' },
          { id: 'stats', label: 'Statistics', icon: '📊' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading && <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p>}

      {!loading && tab === 'category' && (
        <GlassCard style={{ padding: '1.4rem' }}>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', fontWeight: 700, color: A.gold, marginBottom: 12 }}>{category?.family?.label || vendor.category}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
            <div><p style={{ fontSize: 10, color: A.muted, fontFamily: 'IBM Plex Mono' }}>VENDOR ID</p><p style={{ fontSize: 14, color: A.text }}>{vendor.vendorId}</p></div>
            <div><p style={{ fontSize: 10, color: A.muted, fontFamily: 'IBM Plex Mono' }}>CATEGORY</p><p style={{ fontSize: 14, color: A.text }}>{vendor.category}</p></div>
            <div><p style={{ fontSize: 10, color: A.muted, fontFamily: 'IBM Plex Mono' }}>CITY</p><p style={{ fontSize: 14, color: A.text }}>{vendor.city || '—'}</p></div>
            <div><p style={{ fontSize: 10, color: A.muted, fontFamily: 'IBM Plex Mono' }}>TIER</p><p style={{ fontSize: 14, color: A.text }}>{vendor.tier}</p></div>
            <div><p style={{ fontSize: 10, color: A.muted, fontFamily: 'IBM Plex Mono' }}>PRICE</p><p style={{ fontSize: 14, color: A.text }}>{vendor.price || '—'}</p></div>
            <div><p style={{ fontSize: 10, color: A.muted, fontFamily: 'IBM Plex Mono' }}>VERIFIED</p><p style={{ fontSize: 14, color: A.text }}>{vendor.verified ? 'Yes' : 'No'}</p></div>
          </div>
          {category?.family && (
            <>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', marginBottom: 8 }}>CATEGORY-SPECIFIC BOOKING FIELDS</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {category.family.fields.map((f) => (
                  <ABadge key={f.key} color={A.cyan}>{f.label}</ABadge>
                ))}
              </div>
              <p style={{ fontSize: 11, color: A.muted, marginTop: 10, fontStyle: 'italic' }}>
                Captured per booking under the Bookings tab — fields shown here are specific to {category.family.label}.
              </p>
            </>
          )}
        </GlassCard>
      )}

      {!loading && tab === 'orders' && (
        <>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', margin: '4px 0 10px' }}>UNDER VALUATION — ENQUIRIES AWAITING YOUR DECISION</p>
          <GlassCard style={{ padding: '0.5rem 0', marginBottom: 20 }}>
            {orders.underValuation.length === 0
              ? <p style={{ padding: '1.2rem', color: A.muted, fontStyle: 'italic' }}>No enquiries awaiting your decision.</p>
              : <ATable columns={valuationCols} rows={orders.underValuation} />}
          </GlassCard>

          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', margin: '4px 0 10px' }}>ONGOING</p>
          <GlassCard style={{ padding: '0.5rem 0', marginBottom: 20 }}>
            <ATable columns={orderCols} rows={orders.ongoing} />
          </GlassCard>

          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', margin: '4px 0 10px' }}>COMPLETED</p>
          <GlassCard style={{ padding: '0.5rem 0', marginBottom: 20 }}>
            <ATable columns={orderCols} rows={orders.completed} />
          </GlassCard>

          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', margin: '4px 0 10px' }}>REJECTED</p>
          <GlassCard style={{ padding: '0.5rem 0' }}>
            <ATable columns={rejectedCols} rows={orders.rejected} />
          </GlassCard>
        </>
      )}

      {!loading && tab === 'earnings' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <StatCard icon="₹" label="Total Earnings" value={`₹${Number(earnings.totalEarnings || 0).toLocaleString('en-IN')}`} color={A.gold} />
            <StatCard icon="✓" label="Paid Bookings" value={earnings.paidBookingsCount} color={A.green} />
          </div>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', margin: '4px 0 10px' }}>REJECTED SERVICES — WHO & WHY</p>
          <GlassCard style={{ padding: '0.5rem 0' }}>
            {earnings.rejected.length === 0
              ? <p style={{ padding: '1.2rem', color: A.muted, fontStyle: 'italic' }}>No rejected bookings.</p>
              : <ATable columns={earningsRejectedCols} rows={earnings.rejected} />}
          </GlassCard>
        </>
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

      {!loading && tab === 'stats' && (
        <GlassCard style={{ padding: '1.5rem' }}>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', fontWeight: 700, color: A.text, marginBottom: 4 }}>Bookings Received vs Completed</p>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', marginBottom: 16 }}>BY MONTH</p>
          {stats.series.length === 0
            ? <p style={{ color: A.muted, fontStyle: 'italic' }}>Not enough booking history yet.</p>
            : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke={A.border} />
                  <XAxis dataKey="month" tick={{ fill: A.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: A.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="received" name="Received" stroke={A.blue} strokeWidth={2} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke={A.green} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
        </GlassCard>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

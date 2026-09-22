import React, { useEffect, useState } from 'react'
import { ADMIN } from '../data.js'
import { adminApi } from './apiClient.js'
import { ABadge, StatusBadge, ATable, AInput, SectionHeader, GlassCard, Toast } from './ui.jsx'

const A = ADMIN
const STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']
const TIERS = ['SILVER', 'GOLD', 'DIAMOND', 'PLATINUM', 'PLATINUM_PLUS']

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')
  const [tier, setTier] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [dir, setDir] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    adminApi.get('/admin/payments', { params: { status, tier, from, to, sort, dir, pageSize: 100 } })
      .then(({ data }) => { setPayments(data.payments); setTotal(data.total); setError('') })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load payments'))
      .finally(() => setLoading(false))
  }, [status, tier, from, to, sort, dir])

  const toggleSort = (field) => {
    if (sort === field) setDir(dir === 'asc' ? 'desc' : 'asc')
    else { setSort(field); setDir('desc') }
  }

  const cols = [
    { key: 'user', label: 'Member', render: (v) => (
      <div>
        <p style={{ fontWeight: 600, color: A.text, fontSize: 13 }}>{v?.name || '—'}</p>
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>{v?.email}</p>
      </div>
    )},
    { key: 'amount', label: 'Amount ↕', render: (v) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: A.gold }}>₹{v.toLocaleString('en-IN')}</span> },
    { key: 'type', label: 'Type', render: (v, row) => v === 'VENDOR_BOOKING'
      ? <ABadge color={A.cyan}>Vendor: {row.vendor?.name || '—'}{row.vendor?.vendorId ? ` (${row.vendor.vendorId})` : ''}</ABadge>
      : <ABadge color={A.blue}>Membership</ABadge> },
    { key: 'tierAtPayment', label: 'Tier', render: (v) => v ? <ABadge color={A.gold}>{v}</ABadge> : <span style={{ color: A.muted }}>—</span> },
    { key: 'method', label: 'Method', render: (v) => <span style={{ color: A.muted, fontSize: 12 }}>{v}</span> },
    { key: 'dealer', label: 'Dealer', render: (v) => v ? <ABadge color={A.purple}>{v.dealerCode}</ABadge> : <span style={{ color: A.muted }}>—</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v?.toLowerCase()} /> },
    { key: 'createdAt', label: 'Date ↕', render: (v) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muted }}>{new Date(v).toLocaleDateString('en-IN')}</span> },
  ]

  const successTotal = payments.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      <SectionHeader title="Payments" sub={`${total} payment${total === 1 ? '' : 's'}`} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: total, color: A.gold },
          { label: 'Success', value: payments.filter((p) => p.status === 'SUCCESS').length, color: A.green },
          { label: 'Failed', value: payments.filter((p) => p.status === 'FAILED').length, color: A.red },
          { label: 'Refunded', value: payments.filter((p) => p.status === 'REFUNDED').length, color: A.orange },
          { label: 'Shown-page Revenue', value: `₹${successTotal.toLocaleString('en-IN')}`, color: A.purple },
        ].map((s) => (
          <div key={s.label} style={{ background: s.color + '14', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <GlassCard style={{ padding: '1rem 1.2rem', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 140 }}><AInput label="Status" value={status} onChange={setStatus} options={STATUSES} /></div>
          <div style={{ minWidth: 140 }}><AInput label="Tier" value={tier} onChange={setTier} options={TIERS} /></div>
          <div style={{ minWidth: 150 }}><AInput label="From" type="date" value={from} onChange={setFrom} /></div>
          <div style={{ minWidth: 150 }}><AInput label="To" type="date" value={to} onChange={setTo} /></div>
          <button onClick={() => toggleSort('amount')} style={{ background: 'none', border: `1px solid ${A.border}`, borderRadius: 8, color: A.muted, fontFamily: 'IBM Plex Mono', fontSize: 11, padding: '8px 12px', cursor: 'pointer' }}>
            Sort: Amount {sort === 'amount' ? (dir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button onClick={() => { setStatus(''); setTier(''); setFrom(''); setTo('') }} style={{ background: 'none', border: `1px solid ${A.border}`, borderRadius: 8, color: A.muted, fontFamily: 'Inter', fontSize: 12, padding: '8px 12px', cursor: 'pointer' }}>
            Clear
          </button>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: '0.5rem 0' }}>
        {loading ? <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p> : <ATable columns={cols} rows={payments} />}
      </GlassCard>
    </div>
  )
}

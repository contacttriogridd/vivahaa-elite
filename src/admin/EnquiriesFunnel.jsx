import React, { useEffect, useState } from 'react'
import { ADMIN } from '../data.js'
import { adminApi } from './apiClient.js'
import { StatusBadge, ATable, AInput, SectionHeader, GlassCard, StatCard } from './ui.jsx'

const A = ADMIN

export default function EnquiriesFunnel() {
  const [funnel, setFunnel] = useState({ total: 0, converted: 0, conversionRate: 0 })
  const [enquiries, setEnquiries] = useState([])
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      adminApi.get('/admin/enquiries/funnel', { params: { from, to } }),
      adminApi.get('/admin/enquiries', { params: { status, from, to, pageSize: 100 } }),
    ])
      .then(([f, e]) => { setFunnel(f.data); setEnquiries(e.data.enquiries) })
      .finally(() => setLoading(false))
  }, [status, from, to])

  const cols = [
    { key: 'message', label: 'Enquiry', render: (v) => <span style={{ fontSize: 13, color: A.text }}>{v || '—'}</span> },
    { key: 'user', label: 'From', render: (v) => <span style={{ fontSize: 12, color: A.muted }}>{v?.name || 'Guest'}</span> },
    { key: 'vendor', label: 'Vendor', render: (v) => v ? <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.cyan }}>{v.name} ({v.vendorId})</span> : <span style={{ color: A.muted }}>General</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v?.toLowerCase()} /> },
    { key: 'createdAt', label: 'Date', render: (v) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muted }}>{new Date(v).toLocaleDateString('en-IN')}</span> },
  ]

  return (
    <div>
      <SectionHeader title="Enquiries Funnel" sub="Site-wide enquiry-to-booking conversion" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="✉" label="Total Enquiries" value={funnel.total} color={A.blue} />
        <StatCard icon="✓" label="Converted" value={funnel.converted} color={A.green} />
        <StatCard icon="◈" label="Conversion Rate" value={`${funnel.conversionRate}%`} color={A.gold} />
      </div>

      <GlassCard style={{ padding: '1rem 1.2rem', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 140 }}><AInput label="Status" value={status} onChange={setStatus} options={['OPEN', 'CONVERTED', 'CLOSED']} /></div>
          <div style={{ minWidth: 150 }}><AInput label="From" type="date" value={from} onChange={setFrom} /></div>
          <div style={{ minWidth: 150 }}><AInput label="To" type="date" value={to} onChange={setTo} /></div>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: '0.5rem 0' }}>
        {loading ? <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p> : <ATable columns={cols} rows={enquiries} />}
      </GlassCard>
    </div>
  )
}

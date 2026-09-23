import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ADMIN, CITIES } from '../data.js'
import { adminApi } from './apiClient.js'
import { ABtn, ABadge, StatusBadge, ATable, AModal, AInput, SearchBar, SectionHeader, GlassCard, GoldDivider, Toast, ATabs } from './ui.jsx'

const A = ADMIN

function DealerDetail({ dealerId, onClose, onUpdate }) {
  const [dealer, setDealer] = useState(null)
  const [toast, setToast] = useState(null)

  const load = () => adminApi.get(`/admin/dealers/${dealerId}`).then(({ data }) => setDealer(data.dealer))
  useEffect(() => { load() }, [dealerId])

  if (!dealer) return null

  const toggle = async () => {
    const status = dealer.status === 'active' ? 'suspended' : 'active'
    await adminApi.patch(`/admin/dealers/${dealer.id}`, { status })
    setToast({ message: `Dealer ${status}`, type: status === 'active' ? 'success' : 'error' })
    load(); onUpdate()
  }

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(540px, 100vw)', zIndex: 500, background: A.card, borderLeft: `1px solid ${A.borderGlow}`, boxShadow: '-20px 0 80px rgba(0,0,0,0.6)', overflowY: 'auto' }}
    >
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ padding: '1.5rem', borderBottom: `1px solid ${A.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
          <ABtn size="sm" variant={dealer.status === 'active' ? 'danger' : 'success'} onClick={toggle}>
            {dealer.status === 'active' ? 'Suspend' : 'Activate'}
          </ABtn>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: A.gold + '22', border: `2px solid ${A.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🤝</div>
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', fontWeight: 700, color: A.text }}>{dealer.name}</h3>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em' }}>{dealer.email} · {dealer.city}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <StatusBadge status={dealer.status} />
              {dealer.verified && <ABadge color={A.cyan} dot>Verified</ABadge>}
              <ABadge color={A.gold}>{dealer.dealerCode}</ABadge>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            ['Total Members', dealer.users.length, A.gold],
            ['Approved', dealer.users.filter((u) => u.approved).length, A.green],
            ['Commission %', `${dealer.commissionPct}%`, A.purple],
            ['Payments Attributed', dealer.payments.length, A.cyan],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: A.panel, borderRadius: 10, padding: 12, border: `1px solid ${A.border}` }}>
              <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', fontWeight: 700, color }}>{val}</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>

        <GoldDivider />
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Registered Members ({dealer.users.length})
        </p>
        {dealer.users.map((u) => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${A.border}22` }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{u.name}</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>{u.city} · {u.plan}</p>
            </div>
            <StatusBadge status={u.approved ? 'active' : 'pending'} />
          </div>
        ))}

        <GoldDivider />
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Payments Attributed ({dealer.payments.length})
        </p>
        {dealer.payments.length === 0 && <p style={{ color: A.muted, fontStyle: 'italic', fontSize: 13 }}>None yet</p>}
        {dealer.payments.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${A.border}22`, fontSize: 13 }}>
            <span style={{ color: A.text }}>{p.user?.name}</span>
            <span style={{ fontFamily: 'IBM Plex Mono', color: A.gold }}>₹{p.amount.toLocaleString('en-IN')}</span>
            <StatusBadge status={p.status?.toLowerCase()} />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function EditRequestsPanel() {
  const [requests, setRequests] = useState([])
  const [dealers, setDealers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ dealerId: '', description: '' })
  const [toast, setToast] = useState(null)

  const load = () => {
    adminApi.get('/admin/dealer-edit-requests').then(({ data }) => setRequests(data.requests))
    adminApi.get('/admin/dealers').then(({ data }) => setDealers(data.dealers))
  }
  useEffect(() => { load() }, [])

  const resolve = async (id) => {
    await adminApi.patch(`/admin/dealer-edit-requests/${id}/resolve`)
    setToast({ message: 'Marked resolved', type: 'success' })
    load()
  }

  const logRequest = async () => {
    if (!form.dealerId || !form.description) return
    await adminApi.post('/admin/dealer-edit-requests', form)
    setShowAdd(false); setForm({ dealerId: '', description: '' })
    setToast({ message: 'Edit request logged', type: 'success' })
    load()
  }

  const cols = [
    { key: 'dealer', label: 'Dealer', render: (v) => <ABadge color={A.gold}>{v?.dealerCode}</ABadge> },
    { key: 'description', label: 'Request', render: (v) => <span style={{ fontSize: 13, color: A.text }}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'resolvedBy', label: 'Resolved By', render: (v) => v ? <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muted }}>{v.employeeCode}</span> : '—' },
    { key: 'id', label: '', render: (v, row) => row.status === 'open'
      ? <ABtn size="sm" variant="success" onClick={() => resolve(v)}>Resolve</ABtn>
      : null },
  ]

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <ABtn size="sm" variant="primary" icon="+" onClick={() => setShowAdd(true)}>Log Edit Request</ABtn>
      </div>
      <GlassCard style={{ padding: '0.5rem 0' }}>
        <ATable columns={cols} rows={requests} />
      </GlassCard>

      <AModal open={showAdd} onClose={() => setShowAdd(false)} title="Log Dealer Edit Request" width={480}>
        <AInput label="Dealer" value={form.dealerId} onChange={(v) => setForm((f) => ({ ...f, dealerId: v }))}
          options={dealers.map((d) => d.id)} />
        <p style={{ fontSize: 11, color: A.muted, marginTop: -10, marginBottom: 14 }}>
          {dealers.find((d) => d.id === form.dealerId)?.name || 'Select the dealer who emailed/ticketed this request'}
        </p>
        <AInput label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="What needs correcting, and for which member" />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <ABtn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</ABtn>
          <ABtn variant="primary" onClick={logRequest}>Log Request</ABtn>
        </div>
      </AModal>
    </div>
  )
}

export default function Dealers() {
  const [tab, setTab] = useState('dealers')
  const [dealers, setDealers] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newDealer, setNewDealer] = useState({ name: '', email: '', phone: '', city: '', dealerCode: '', commissionPct: 8 })
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => adminApi.get('/admin/dealers').then(({ data }) => setDealers(data.dealers)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const filtered = dealers.filter((d) => {
    const q = search.toLowerCase()
    return !q || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || d.dealerCode.toLowerCase().includes(q)
  })

  const addDealer = async () => {
    try {
      await adminApi.post('/admin/dealers', newDealer)
      setShowAdd(false)
      setNewDealer({ name: '', email: '', phone: '', city: '', dealerCode: '', commissionPct: 8 })
      setToast({ message: 'Dealer added successfully', type: 'success' })
      load()
    } catch (e) {
      setToast({ message: e.response?.data?.message || 'Failed to add dealer', type: 'error' })
    }
  }

  const cols = [
    { key: 'name', label: 'Dealer', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: A.gold + '22', border: `1px solid ${A.gold}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤝</div>
        <div>
          <p style={{ fontWeight: 600, color: A.text, fontSize: 13 }}>{v}</p>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>{row.email}</p>
        </div>
      </div>
    )},
    { key: 'dealerCode', label: 'Code', render: (v) => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'city', label: 'City', render: (v) => <span style={{ color: A.muted, fontSize: 12 }}>{v || '—'}</span> },
    { key: '_count', label: 'Members', render: (v) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: A.text }}>{v.users}</span> },
    { key: 'totalEarned', label: 'Earned', render: (v) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: A.gold }}>₹{v.toLocaleString('en-IN')}</span> },
    { key: 'commissionPct', label: 'Commission', render: (v) => <ABadge color={A.cyan}>{v}%</ABadge> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ]

  const leaderboard = [...dealers].sort((a, b) => b.totalEarned - a.totalEarned).slice(0, 4)

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <SectionHeader
        title="Dealer Management"
        sub={`${dealers.length} registered dealers`}
        actions={[<ABtn key="add" variant="primary" icon="+" onClick={() => setShowAdd(true)}>Add Dealer</ABtn>]}
      />

      <ATabs tabs={[{ id: 'dealers', label: 'Dealers', icon: '🤝' }, { id: 'requests', label: 'Edit Requests', icon: '✎' }]} active={tab} onChange={setTab} />

      {tab === 'requests' ? <EditRequestsPanel /> : (
        <>
          {leaderboard.length > 0 && (
            <GlassCard style={{ padding: '1.5rem', marginBottom: 24 }} glow>
              <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', fontWeight: 700, color: A.text, marginBottom: 16 }}>🏆 Dealer Leaderboard</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {leaderboard.map((d, i) => (
                  <motion.div key={d.id} whileHover={{ y: -4 }} onClick={() => setSelected(d.id)}
                    style={{ flex: 1, minWidth: 160, background: i === 0 ? A.gold + '14' : A.panel, borderRadius: 12, padding: '1rem', border: `1px solid ${i === 0 ? A.gold + '44' : A.border}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, color: [A.gold, '#C0C0C0', '#CD7F32'][i] || A.muted }}>{['🥇', '🥈', '🥉'][i] || `#${i + 1}`}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <p style={{ fontWeight: 600, color: A.text, fontSize: 13, marginBottom: 2 }}>{d.name}</p>
                    <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, marginBottom: 8 }}>{d.city} · {d.dealerCode}</p>
                    <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', fontWeight: 700, color: A.gold }}>₹{d.totalEarned.toLocaleString('en-IN')}</p>
                    <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d._count.users} members</p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}

          <GlassCard style={{ padding: '1rem 1.2rem', marginBottom: 16 }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search dealers…" />
          </GlassCard>
          <GlassCard style={{ padding: '0.5rem 0' }}>
            {loading ? <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p> : <ATable columns={cols} rows={filtered} onRowClick={(row) => setSelected(row.id)} />}
          </GlassCard>
        </>
      )}

      <AModal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Dealer">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <AInput label="Name" value={newDealer.name} onChange={(v) => setNewDealer((f) => ({ ...f, name: v }))} />
          <AInput label="Email" value={newDealer.email} onChange={(v) => setNewDealer((f) => ({ ...f, email: v }))} />
          <AInput label="Phone" value={newDealer.phone} onChange={(v) => setNewDealer((f) => ({ ...f, phone: v }))} />
          <AInput label="City" value={newDealer.city} onChange={(v) => setNewDealer((f) => ({ ...f, city: v }))} options={CITIES} />
          <AInput label="Dealer Code" value={newDealer.dealerCode} onChange={(v) => setNewDealer((f) => ({ ...f, dealerCode: v.toUpperCase() }))} />
          <AInput label="Commission %" type="number" value={String(newDealer.commissionPct)} onChange={(v) => setNewDealer((f) => ({ ...f, commissionPct: Number(v) }))} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <ABtn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</ABtn>
          <ABtn variant="primary" onClick={addDealer}>Add Dealer</ABtn>
        </div>
      </AModal>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 499 }} />
            <DealerDetail dealerId={selected} onClose={() => setSelected(null)} onUpdate={load} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

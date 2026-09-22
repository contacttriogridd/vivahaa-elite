import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ADMIN, CITIES, VENDOR_CATS } from '../data.js'
import { adminApi } from './apiClient.js'
import { ABtn, ABadge, StatusBadge, ATable, AModal, AInput, SearchBar, SectionHeader, GlassCard, GoldDivider, Toast, ATabs } from './ui.jsx'

const A = ADMIN

function VendorDetail({ vendorId, onClose, onUpdate }) {
  const [detail, setDetail] = useState(null)
  const [toast, setToast] = useState(null)
  const [complaintForm, setComplaintForm] = useState({ description: '', contactLog: '' })
  const [showComplaint, setShowComplaint] = useState(false)

  const load = () => adminApi.get(`/admin/vendors/${vendorId}`).then(({ data }) => setDetail(data))
  useEffect(() => { load() }, [vendorId])

  if (!detail) return null
  const { vendor, cancelledBookings, avgRating } = detail

  const toggle = async () => {
    const status = vendor.status === 'active' ? 'suspended' : 'active'
    await adminApi.patch(`/admin/vendors/${vendor.id}`, { status })
    setToast({ message: `Vendor ${status}`, type: status === 'active' ? 'success' : 'error' })
    load(); onUpdate()
  }

  const logComplaint = async () => {
    if (!complaintForm.description) return
    await adminApi.post('/admin/vendor-complaints', { vendorId: vendor.id, description: complaintForm.description, contactLog: complaintForm.contactLog })
    setShowComplaint(false); setComplaintForm({ description: '', contactLog: '' })
    setToast({ message: 'Complaint logged', type: 'success' })
  }

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(520px, 100vw)', zIndex: 500, background: A.card, borderLeft: `1px solid ${A.borderGlow}`, boxShadow: '-20px 0 80px rgba(0,0,0,0.6)', overflowY: 'auto' }}
    >
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ padding: '1.5rem', borderBottom: `1px solid ${A.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <ABtn size="sm" variant="ghost" onClick={() => setShowComplaint(true)}>Log Complaint</ABtn>
            <ABtn size="sm" variant={vendor.status === 'active' ? 'danger' : 'success'} onClick={toggle}>
              {vendor.status === 'active' ? 'Suspend' : 'Activate'}
            </ABtn>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: A.gold + '22', border: `2px solid ${A.gold}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏪</div>
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', fontWeight: 700, color: A.text }}>{vendor.name}</h3>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em' }}>{vendor.vendorId} · {vendor.category} · {vendor.city}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <StatusBadge status={vendor.status} />
              <ABadge color={vendor.tier === 'elite' ? A.gold : A.blue}>{vendor.tier}</ABadge>
              <ABadge color={A.orange}>⭐ {avgRating} ({vendor.ratings.length})</ABadge>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            ['Bookings', vendor.bookings.length, A.blue],
            ['Enquiries', vendor.enquiries.length, A.cyan],
            ['Payments', vendor.payments.length, A.gold],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: A.panel, borderRadius: 10, padding: 10, border: `1px solid ${A.border}`, textAlign: 'center' }}>
              <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', fontWeight: 700, color }}>{val}</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.muted, textTransform: 'uppercase' }}>{label}</p>
            </div>
          ))}
        </div>

        <GoldDivider />
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Cancelled Bookings ({cancelledBookings.length})
        </p>
        {cancelledBookings.length === 0 && <p style={{ color: A.muted, fontStyle: 'italic', fontSize: 13, marginBottom: 12 }}>None</p>}
        {cancelledBookings.map((b) => (
          <div key={b.id} style={{ background: A.panel, borderRadius: 10, padding: '10px 12px', marginBottom: 8, border: `1px solid ${A.red}33` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{b.serviceType} — {b.user?.name}</span>
              <ABadge color={A.red}>Cancelled by {b.cancelledBy === 'USER' ? 'Member' : 'Vendor'}</ABadge>
            </div>
            <p style={{ fontSize: 12, color: A.muted }}>{b.cancelReason || 'No reason given'}</p>
          </div>
        ))}

        <GoldDivider />
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Ratings & Reviews</p>
        {vendor.ratings.length === 0 && <p style={{ color: A.muted, fontStyle: 'italic', fontSize: 13 }}>No ratings yet</p>}
        {vendor.ratings.map((r) => (
          <div key={r.id} style={{ padding: '8px 0', borderBottom: `1px solid ${A.border}22` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: A.text, fontWeight: 500 }}>{r.user?.name}</span>
              <span style={{ color: A.orange, fontSize: 12 }}>{'⭐'.repeat(r.rating)}</span>
            </div>
            {r.review && <p style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>{r.review}</p>}
          </div>
        ))}
      </div>

      <AModal open={showComplaint} onClose={() => setShowComplaint(false)} title="Log Vendor Complaint" width={480}>
        <AInput label="Description" value={complaintForm.description} onChange={(v) => setComplaintForm((f) => ({ ...f, description: v }))} />
        <AInput label="1:1 Contact Made With Vendor" value={complaintForm.contactLog} onChange={(v) => setComplaintForm((f) => ({ ...f, contactLog: v }))} placeholder="e.g. Called vendor on 22 Sep, explained the delay complaint" />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <ABtn variant="ghost" onClick={() => setShowComplaint(false)}>Cancel</ABtn>
          <ABtn variant="primary" onClick={logComplaint}>Log Complaint</ABtn>
        </div>
      </AModal>
    </motion.div>
  )
}

function ComplaintsPanel() {
  const [complaints, setComplaints] = useState([])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => adminApi.get('/admin/vendor-complaints').then(({ data }) => setComplaints(data.complaints)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const resolve = async (id) => {
    await adminApi.patch(`/admin/vendor-complaints/${id}/resolve`)
    setToast({ message: 'Complaint resolved', type: 'success' })
    load()
  }

  const cols = [
    { key: 'vendor', label: 'Vendor', render: (v) => <ABadge color={A.gold}>{v?.vendorId} — {v?.name}</ABadge> },
    { key: 'user', label: 'Member', render: (v) => <span style={{ fontSize: 12, color: A.muted }}>{v?.name || '—'}</span> },
    { key: 'description', label: 'Complaint', render: (v) => <span style={{ fontSize: 13, color: A.text }}>{v}</span> },
    { key: 'contactLog', label: '1:1 Contact', render: (v) => <span style={{ fontSize: 12, color: A.muted }}>{v || '—'}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'handledBy', label: 'Handled By', render: (v) => v ? <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muted }}>{v.employeeCode}</span> : '—' },
    { key: 'id', label: '', render: (v, row) => row.status === 'open'
      ? <ABtn size="sm" variant="success" onClick={() => resolve(v)}>Resolve</ABtn>
      : null },
  ]

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <GlassCard style={{ padding: '0.5rem 0' }}>
        {loading ? <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p> : <ATable columns={cols} rows={complaints} />}
      </GlassCard>
    </div>
  )
}

export default function Vendors() {
  const [tab, setTab] = useState('vendors')
  const [vendors, setVendors] = useState([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newV, setNewV] = useState({ name: '', category: '', city: '', tier: 'standard', email: '', password: '', phone: '', price: '', commissionPct: 10 })
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => adminApi.get('/admin/vendors', { params: { category: filterCat, city: filterCity, tier: filterTier, search } })
    .then(({ data }) => setVendors(data.vendors))
    .finally(() => setLoading(false))

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [search, filterCat, filterCity, filterTier])

  const addVendor = async () => {
    try {
      await adminApi.post('/admin/vendors', newV)
      setShowAdd(false)
      setNewV({ name: '', category: '', city: '', tier: 'standard', email: '', password: '', phone: '', price: '', commissionPct: 10 })
      setToast({ message: 'Vendor added — ID generated automatically', type: 'success' })
      load()
    } catch (e) {
      setToast({ message: e.response?.data?.message || 'Failed to add vendor', type: 'error' })
    }
  }

  const cols = [
    { key: 'name', label: 'Vendor', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: A.gold + '18', border: `1px solid ${A.gold}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏪</div>
        <div>
          <p style={{ fontWeight: 600, color: A.text, fontSize: 13 }}>{v}</p>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>{row.category}</p>
        </div>
      </div>
    )},
    { key: 'vendorId', label: 'Vendor ID', render: (v) => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'city', label: 'City', render: (v) => <span style={{ color: A.muted, fontSize: 12 }}>{v}</span> },
    { key: 'tier', label: 'Tier', render: (v) => <ABadge color={v === 'elite' ? A.gold : v === 'shared' ? A.cyan : A.blue}>{v}</ABadge> },
    { key: 'avgRating', label: 'Rating', render: (v, row) => <span style={{ color: A.orange, fontSize: 12 }}>⭐ {v} ({row._count.ratings})</span> },
    { key: '_count', label: 'Bookings', render: (v) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: A.text }}>{v.bookings}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ]

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <SectionHeader
        title="Vendor Management"
        sub={`${vendors.length} vendors`}
        actions={[<ABtn key="add" variant="primary" icon="+" onClick={() => setShowAdd(true)}>Add Vendor</ABtn>]}
      />

      <ATabs tabs={[{ id: 'vendors', label: 'Vendors', icon: '🏪' }, { id: 'complaints', label: 'Complaints', icon: '⚠' }]} active={tab} onChange={setTab} />

      {tab === 'complaints' ? <ComplaintsPanel /> : (
        <>
          <GlassCard style={{ padding: '1rem 1.2rem', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search vendors…" />
              <div style={{ minWidth: 140 }}><AInput label="Category" value={filterCat} onChange={setFilterCat} options={VENDOR_CATS} /></div>
              <div style={{ minWidth: 120 }}><AInput label="City" value={filterCity} onChange={setFilterCity} options={CITIES} /></div>
              <div style={{ minWidth: 110 }}><AInput label="Tier" value={filterTier} onChange={setFilterTier} options={['standard', 'elite', 'shared']} /></div>
              <ABtn variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterCat(''); setFilterCity(''); setFilterTier('') }}>Clear</ABtn>
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '0.5rem 0' }}>
            {loading ? <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p> : <ATable columns={cols} rows={vendors} onRowClick={(row) => setSelected(row.id)} />}
          </GlassCard>
        </>
      )}

      <AModal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Vendor">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <AInput label="Name" value={newV.name} onChange={(v) => setNewV((f) => ({ ...f, name: v }))} />
          <AInput label="Category" value={newV.category} onChange={(v) => setNewV((f) => ({ ...f, category: v }))} options={VENDOR_CATS} />
          <AInput label="City" value={newV.city} onChange={(v) => setNewV((f) => ({ ...f, city: v }))} options={CITIES} />
          <AInput label="Tier" value={newV.tier} onChange={(v) => setNewV((f) => ({ ...f, tier: v }))} options={['standard', 'elite', 'shared']} />
          <AInput label="Login Email" value={newV.email} onChange={(v) => setNewV((f) => ({ ...f, email: v }))} />
          <AInput label="Login Password" type="password" value={newV.password} onChange={(v) => setNewV((f) => ({ ...f, password: v }))} />
          <AInput label="Contact Phone" value={newV.phone} onChange={(v) => setNewV((f) => ({ ...f, phone: v }))} />
          <AInput label="Starting Price" value={newV.price} onChange={(v) => setNewV((f) => ({ ...f, price: v }))} />
          <AInput label="Commission %" type="number" value={String(newV.commissionPct)} onChange={(v) => setNewV((f) => ({ ...f, commissionPct: Number(v) }))} />
        </div>
        <p style={{ fontSize: 11, color: A.muted, margin: '4px 0 14px', fontStyle: 'italic' }}>
          Vendor ID (e.g. V00{vendors.length + 1}{newV.category ? '..' : 'XX'}) is generated automatically from category + sequence.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <ABtn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</ABtn>
          <ABtn variant="primary" onClick={addVendor}>Add Vendor</ABtn>
        </div>
      </AModal>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 499 }} />
            <VendorDetail vendorId={selected} onClose={() => setSelected(null)} onUpdate={load} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

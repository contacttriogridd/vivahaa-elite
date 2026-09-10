import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ADMIN, state, CITIES, VENDOR_CATS } from '../data.js'
import { ABtn, ABadge, StatusBadge, ATable, AModal, AInput, SearchBar, SectionHeader, GlassCard, GoldDivider, ProgressBar, Toast } from './ui.jsx'

const A = ADMIN

function VendorDetail({ vendor, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...vendor })
  const [toast, setToast] = useState(null)
  if (!vendor) return null
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => { Object.assign(vendor, form); setEditing(false); onUpdate(); setToast({ message: 'Vendor updated', type: 'success' }) }
  const toggle = () => { vendor.status = vendor.status === 'active' ? 'suspended' : 'active'; onUpdate(); setToast({ message: `Vendor ${vendor.status}`, type: vendor.status === 'active' ? 'success' : 'error' }) }

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 480, zIndex: 500, background: A.card, borderLeft: `1px solid ${A.borderGlow}`, boxShadow: `-20px 0 80px rgba(0,0,0,0.6)`, overflowY: 'auto' }}
    >
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ padding: '1.5rem', borderBottom: `1px solid ${A.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!editing && <ABtn size="sm" variant="outline" onClick={() => setEditing(true)} icon="✎">Edit</ABtn>}
            {editing && <><ABtn size="sm" variant="success" onClick={save}>Save</ABtn><ABtn size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</ABtn></>}
            <ABtn size="sm" variant={vendor.status === 'active' ? 'danger' : 'success'} onClick={toggle}>
              {vendor.status === 'active' ? 'Suspend' : 'Activate'}
            </ABtn>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: A.gold + '22', border: `2px solid ${A.gold}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏪</div>
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', fontWeight: 700, color: A.text }}>{vendor.name}</h3>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em' }}>{vendor.category} · {vendor.city}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <StatusBadge status={vendor.status} />
              <ABadge color={vendor.tier === 'elite' ? A.gold : A.blue}>{vendor.tier}</ABadge>
              {vendor.verified && <ABadge color={A.cyan} dot>Verified</ABadge>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <AInput label="Name" value={form.name} onChange={v => set('name', v)} />
            <AInput label="Category" value={form.category} onChange={v => set('category', v)} options={VENDOR_CATS} />
            <AInput label="City" value={form.city} onChange={v => set('city', v)} options={CITIES} />
            <AInput label="Tier" value={form.tier} onChange={v => set('tier', v)} options={['standard', 'elite', 'shared']} />
            <AInput label="Contact" value={form.contact} onChange={v => set('contact', v)} />
            <AInput label="Email" value={form.email} onChange={v => set('email', v)} />
            <AInput label="Price" value={form.price} onChange={v => set('price', v)} />
            <AInput label="Commission %" type="number" value={String(form.commissionPct)} onChange={v => set('commissionPct', Number(v))} />
            <AInput label="GST" value={form.gst} onChange={v => set('gst', v)} />
            <AInput label="Address" value={form.address} onChange={v => set('address', v)} />
          </div>
        ) : (
          <div>
            {[
              ['Name', vendor.name], ['Category', vendor.category], ['City', vendor.city],
              ['Contact', vendor.contact], ['Email', vendor.email], ['Price', vendor.price],
              ['Commission', `${vendor.commissionPct}%`], ['GST', vendor.gst],
              ['Address', vendor.address], ['Rating', `⭐ ${vendor.rating}/5 (${vendor.reviews} reviews)`],
              ['Bookings', vendor.bookings], ['Monthly Revenue', `₹${(vendor.monthlyRevenue || 0).toLocaleString('en-IN')}`],
              ['Joined', vendor.joinedAt ? new Date(vendor.joinedAt).toLocaleDateString('en-IN') : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${A.border}22`, fontSize: 13 }}>
                <span style={{ color: A.muted, fontFamily: 'IBM Plex Mono', fontSize: 11 }}>{k}</span>
                <span style={{ color: A.text, fontWeight: 500, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
            <GoldDivider />
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Gallery</p>
            <div style={{ background: A.panel, borderRadius: 10, padding: '1.5rem', textAlign: 'center', border: `1px dashed ${A.border}` }}>
              <p style={{ fontSize: 28, marginBottom: 6 }}>🖼</p>
              <p style={{ fontSize: 12, color: A.muted, fontStyle: 'italic' }}>No gallery images uploaded</p>
              <ABtn size="sm" variant="ghost" style={{ marginTop: 10 }} icon="⬆">Upload Images</ABtn>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Vendors({ refresh }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newV, setNewV] = useState({ name: '', category: '', city: '', tier: 'standard', contact: '', email: '', price: '', commissionPct: 10, gst: '', address: '' })
  const [toast, setToast] = useState(null)
  const [, forceUpdate] = useState(0)
  const re = () => { forceUpdate(n => n + 1); refresh() }

  const filtered = useMemo(() => state.vendors.filter(v => {
    const q = search.toLowerCase()
    if (q && !v.name.toLowerCase().includes(q) && !v.city.toLowerCase().includes(q)) return false
    if (filterCat && v.category !== filterCat) return false
    if (filterCity && v.city !== filterCity) return false
    if (filterTier && v.tier !== filterTier) return false
    return true
  }), [search, filterCat, filterCity, filterTier, state.vendors.length])

  const addVendor = () => {
    state.vendors.push({ ...newV, id: `v${Date.now()}`, rating: 4.0, reviews: 0, bookings: 0, status: 'active', verified: false, monthlyRevenue: 0, gallery: [], joinedAt: new Date().toISOString() })
    setShowAdd(false)
    setNewV({ name: '', category: '', city: '', tier: 'standard', contact: '', email: '', price: '', commissionPct: 10, gst: '', address: '' })
    setToast({ message: 'Vendor added', type: 'success' })
    re()
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
    { key: 'city', label: 'City', render: v => <span style={{ color: A.muted, fontSize: 12 }}>{v}</span> },
    { key: 'tier', label: 'Tier', render: v => <ABadge color={v === 'elite' ? A.gold : v === 'shared' ? A.cyan : A.blue}>{v}</ABadge> },
    { key: 'price', label: 'Price', render: v => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: A.gold }}>{v}</span> },
    { key: 'rating', label: 'Rating', render: v => <span style={{ color: A.orange, fontSize: 12 }}>⭐ {v}</span> },
    { key: 'commissionPct', label: 'Comm%', render: v => <ABadge color={A.cyan}>{v}%</ABadge> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'verified', label: 'Verified', render: v => <StatusBadge status={v ? 'verified' : 'pending'} /> },
  ]

  const totalRevenue = state.vendors.reduce((s, v) => s + (v.monthlyRevenue || 0), 0)

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <SectionHeader
        title="Vendor Management"
        sub={`${filtered.length} of ${state.vendors.length} vendors`}
        actions={[
          <ABtn key="add" variant="primary" icon="+" onClick={() => setShowAdd(true)}>Add Vendor</ABtn>,
          <ABtn key="exp" variant="ghost" icon="⬇">Export</ABtn>,
        ]}
      />

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Vendors', value: state.vendors.length, color: A.gold },
          { label: 'Active', value: state.vendors.filter(v => v.status === 'active').length, color: A.green },
          { label: 'Verified', value: state.vendors.filter(v => v.verified).length, color: A.cyan },
          { label: 'Monthly Revenue', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, color: A.purple },
        ].map(s => (
          <div key={s.label} style={{ background: s.color + '14', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '10px 18px' }}>
            <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
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
        <ATable columns={cols} rows={filtered} onRowClick={setSelected} />
      </GlassCard>

      {/* Add modal */}
      <AModal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Vendor">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <AInput label="Name" value={newV.name} onChange={v => setNewV(f => ({ ...f, name: v }))} />
          <AInput label="Category" value={newV.category} onChange={v => setNewV(f => ({ ...f, category: v }))} options={VENDOR_CATS} />
          <AInput label="City" value={newV.city} onChange={v => setNewV(f => ({ ...f, city: v }))} options={CITIES} />
          <AInput label="Tier" value={newV.tier} onChange={v => setNewV(f => ({ ...f, tier: v }))} options={['standard', 'elite', 'shared']} />
          <AInput label="Contact" value={newV.contact} onChange={v => setNewV(f => ({ ...f, contact: v }))} />
          <AInput label="Email" value={newV.email} onChange={v => setNewV(f => ({ ...f, email: v }))} />
          <AInput label="Starting Price" value={newV.price} onChange={v => setNewV(f => ({ ...f, price: v }))} />
          <AInput label="Commission %" type="number" value={String(newV.commissionPct)} onChange={v => setNewV(f => ({ ...f, commissionPct: Number(v) }))} />
        </div>
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
            <VendorDetail vendor={selected} onClose={() => setSelected(null)} onUpdate={re} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

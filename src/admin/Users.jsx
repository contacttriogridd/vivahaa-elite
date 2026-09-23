import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ADMIN, state, NAKSHATRAS, RASHIS, CITIES } from '../data.js'
import { ABtn, ABadge, StatusBadge, ATable, AModal, AInput, SearchBar, SectionHeader, GlassCard, GoldDivider, ProgressBar, ATabs, Toast } from './ui.jsx'

const A = ADMIN

function ProfileDrawer({ user, onClose, onUpdate }) {
  const [tab, setTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...user })
  const [toast, setToast] = useState(null)

  if (!user) return null
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    Object.assign(user, form)
    setEditing(false)
    setToast({ message: 'Profile updated successfully', type: 'success' })
    onUpdate()
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '◉' },
    { id: 'horoscope', label: 'Horoscope', icon: '☽' },
    { id: 'payments', label: 'Payments', icon: '₹' },
    { id: 'activity', label: 'Activity', icon: '◈' },
    { id: 'notes', label: 'Admin Notes', icon: '✎' },
  ]

  const age = user.dob ? Math.floor((Date.now() - new Date(user.dob)) / (365.25*24*3600*1000)) : '—'

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 520, zIndex: 500,
        background: A.card, borderLeft: `1px solid ${A.borderGlow}`,
        boxShadow: `-20px 0 80px rgba(0,0,0,0.6)`,
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}
    >
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{
        padding: '1.5rem', borderBottom: `1px solid ${A.border}`,
        background: user.tier === 'elite'
          ? `linear-gradient(135deg, #1A1020 0%, ${A.card} 100%)`
          : `linear-gradient(135deg, #1A1010 0%, ${A.card} 100%)`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!editing && <ABtn size="sm" variant="outline" onClick={() => setEditing(true)} icon="✎">Edit</ABtn>}
            {editing && <><ABtn size="sm" variant="success" onClick={save}>Save</ABtn><ABtn size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</ABtn></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: user.tier === 'elite' ? `linear-gradient(135deg, ${A.gold}44, ${A.purple}44)` : `linear-gradient(135deg, ${A.primary}44, ${A.gold}44)`,
            border: `2px solid ${user.tier === 'elite' ? A.gold : A.primary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
          }}>
            {user.gender === 'Female' ? '👩' : '👨'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', fontWeight: 700, color: A.text }}>{user.name}</h3>
              {user.tier === 'elite' && <span style={{ fontSize: 14 }}>♛</span>}
            </div>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', marginBottom: 8 }}>
              {user.id} · {user.city}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={user.status || (user.approved ? 'active' : 'pending')} />
              <StatusBadge status={user.tier} />
              <StatusBadge status={user.fee_status} />
            </div>
          </div>
        </div>
        {/* Profile completion */}
        <div style={{ marginTop: 16 }}>
          <ProgressBar value={user.profileCompletion || 75} label="Profile Completion" color={user.tier === 'elite' ? A.gold : A.blue} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 1.5rem', borderBottom: `1px solid ${A.border}` }}>
        <ATabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      <div style={{ padding: '1.5rem', flex: 1 }}>
        {/* Profile tab */}
        {tab === 'profile' && (
          <div>
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <AInput label="Full Name" value={form.name} onChange={v => set('name', v)} />
                <AInput label="Email" value={form.email} onChange={v => set('email', v)} />
                <AInput label="Phone" value={form.phone} onChange={v => set('phone', v)} />
                <AInput label="City" value={form.city} onChange={v => set('city', v)} options={CITIES} />
                <AInput label="Education" value={form.education} onChange={v => set('education', v)} />
                <AInput label="Occupation" value={form.occupation} onChange={v => set('occupation', v)} />
                <AInput label="Height" value={form.height} onChange={v => set('height', v)} />
                <AInput label="Weight" value={form.weight} onChange={v => set('weight', v)} />
                <AInput label="Blood Group" value={form.bloodGroup} onChange={v => set('bloodGroup', v)} options={['A+','B+','O+','AB+','A-','B-','O-']} />
                <AInput label="Marital Status" value={form.maritalStatus} onChange={v => set('maritalStatus', v)} options={['Never Married','Divorced','Widowed']} />
              </div>
            ) : (
              <div>
                {[
                  ['Name', user.name], ['Email', user.email], ['Phone', user.phone],
                  ['Age', `${age} years`], ['Gender', user.gender], ['DOB', user.dob],
                  ['City', user.city], ['Religion', user.religion], ['Caste', user.caste],
                  ['Education', user.education], ['Occupation', user.occupation],
                  ['Income', user.income ? `₹${user.income}/yr` : '—'],
                  ['Height', user.height || '—'], ['Weight', user.weight || '—'],
                  ['Blood Group', user.bloodGroup || '—'],
                  ['Marital Status', user.maritalStatus || '—'],
                  ['Dosham', user.dosham || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${A.border}22`, fontSize: 13 }}>
                    <span style={{ color: A.muted, fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.06em' }}>{k}</span>
                    <span style={{ color: A.text, fontWeight: 500, textAlign: 'right', maxWidth: 240 }}>{v}</span>
                  </div>
                ))}
                <GoldDivider />
                <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Assets</p>
                {[['Property', user.assets?.property], ['Vehicle', user.assets?.vehicle], ['Savings', user.assets?.savings]].map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${A.border}22`, fontSize: 13 }}>
                    <span style={{ color: A.muted }}>{k}</span>
                    <span style={{ color: A.gold, fontFamily: 'IBM Plex Mono', fontSize: 12 }}>₹{v || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Horoscope tab */}
        {tab === 'horoscope' && (
          <div>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Horoscope Details</p>
            {[['Nakshatra', user.nakshatra], ['Rashi', user.rashi], ['Birth Time', user.birthTime], ['Birth Place', user.birthPlace], ['Dosham', user.dosham]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${A.border}22`, fontSize: 13 }}>
                <span style={{ color: A.muted }}>{k}</span>
                <span style={{ color: A.text, fontWeight: 500 }}>{v || '—'}</span>
              </div>
            ))}
            <GoldDivider />
            <div style={{ background: A.panel, borderRadius: 12, padding: '1.5rem', textAlign: 'center', border: `1px dashed ${A.border}` }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>☽</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em' }}>JADHAGAM / HOROSCOPE CHART</p>
              {user.chartPhoto
                ? <img src={user.chartPhoto} alt="chart" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 12 }} />
                : <p style={{ fontSize: 12, color: A.subtle, marginTop: 8, fontStyle: 'italic' }}>No chart uploaded</p>
              }
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                <ABtn size="sm" variant="ghost" icon="⬇">Download</ABtn>
                <ABtn size="sm" variant="ghost" icon="🔍">Zoom</ABtn>
                <ABtn size="sm" variant="ghost" icon="🖨">Print</ABtn>
              </div>
            </div>
          </div>
        )}

        {/* Payments tab */}
        {tab === 'payments' && (
          <div>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Payment History</p>
            {(user.paymentHistory || []).length === 0
              ? <p style={{ color: A.muted, fontStyle: 'italic', fontSize: 13 }}>No payments recorded</p>
              : (user.paymentHistory || []).map(p => (
                <div key={p.id} style={{ background: A.panel, borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: `1px solid ${A.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.gold }}>₹{p.amount?.toLocaleString('en-IN')}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p style={{ fontSize: 12, color: A.muted }}>{new Date(p.date).toLocaleDateString('en-IN')} · {p.method}</p>
                  <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.subtle }}>{p.id}</p>
                </div>
              ))
            }
          </div>
        )}

        {/* Activity tab */}
        {tab === 'activity' && (
          <div>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Login History</p>
            {(user.loginHistory || []).map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${A.border}22`, fontSize: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: A.green, marginTop: 4, flexShrink: 0 }} />
                <div>
                  <p style={{ color: A.text }}>{new Date(l.ts).toLocaleString('en-IN')}</p>
                  <p style={{ color: A.muted, fontFamily: 'IBM Plex Mono', fontSize: 10 }}>{l.ip} · {l.device}</p>
                </div>
              </div>
            ))}
            {(user.loginHistory || []).length === 0 && <p style={{ color: A.muted, fontStyle: 'italic', fontSize: 13 }}>No login history</p>}
          </div>
        )}

        {/* Admin notes */}
        {tab === 'notes' && (
          <div>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Internal Admin Notes</p>
            <textarea
              value={user.adminNotes || ''}
              onChange={e => { user.adminNotes = e.target.value; onUpdate() }}
              placeholder="Add internal notes about this member…"
              rows={8}
              style={{
                width: '100%', background: A.panel, color: A.text, border: `1px solid ${A.border}`,
                borderRadius: 10, padding: '12px', fontFamily: 'Inter', fontSize: 13,
                outline: 'none', resize: 'vertical',
              }}
            />
          </div>
        )}
      </div>

      {/* Action bar */}
      <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${A.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!user.approved && user.fee_status === 'paid' && (
          <ABtn size="sm" variant="success" icon="✓" onClick={() => { user.approved = true; user.status = 'active'; state.adminLog.unshift({ id:`log${Date.now()}`, action:'approve_user', entity:'User', entityId:user.id, adminId:'admin', ip:'—', ts:new Date().toISOString() }); onUpdate(); setToast({ message:'User approved', type:'success' }) }}>
            Approve
          </ABtn>
        )}
        {user.status !== 'suspended' && (
          <ABtn size="sm" variant="danger" icon="⊘" onClick={() => { user.status = 'suspended'; user.approved = false; state.adminLog.unshift({ id:`log${Date.now()}`, action:'suspend_user', entity:'User', entityId:user.id, adminId:'admin', ip:'—', ts:new Date().toISOString() }); onUpdate(); setToast({ message:'User suspended', type:'error' }) }}>
            Suspend
          </ABtn>
        )}
        {user.status === 'suspended' && (
          <ABtn size="sm" variant="success" icon="✓" onClick={() => { user.status = 'active'; user.approved = true; onUpdate(); setToast({ message:'User activated', type:'success' }) }}>
            Activate
          </ABtn>
        )}
        <ABtn size="sm" variant="ghost" icon="📧">Email</ABtn>
        <ABtn size="sm" variant="ghost" icon="📱">SMS</ABtn>
      </div>
    </motion.div>
  )
}

export default function Users({ refresh }) {
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState(null)
  const [, forceUpdate] = useState(0)
  const re = () => { forceUpdate(n => n+1); refresh() }

  const filtered = useMemo(() => state.users.filter(u => {
    const q = search.toLowerCase()
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.city?.toLowerCase().includes(q)) return false
    if (filterTier && u.tier !== filterTier) return false
    if (filterCity && u.city !== filterCity) return false
    if (filterStatus === 'approved' && !u.approved) return false
    if (filterStatus === 'pending' && (u.approved || u.fee_status !== 'paid')) return false
    if (filterStatus === 'suspended' && u.status !== 'suspended') return false
    if (filterStatus === 'unpaid' && u.fee_status === 'paid') return false
    return true
  }), [search, filterTier, filterStatus, filterCity, state.users.length])

  const cols = [
    { key: 'name', label: 'Member', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: row.tier==='elite' ? A.gold+'22' : A.primary+'22', border: `1px solid ${row.tier==='elite' ? A.gold : A.primary}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
          {row.gender==='Female'?'👩':'👨'}
        </div>
        <div>
          <p style={{ fontWeight:600, color:A.text, fontSize:13 }}>{v}</p>
          <p style={{ fontFamily:'IBM Plex Mono', fontSize:10, color:A.muted }}>{row.email}</p>
        </div>
      </div>
    )},
    { key: 'city', label: 'City', render: v => <span style={{ color:A.muted, fontSize:12 }}>{v}</span> },
    { key: 'tier', label: 'Tier', render: v => <StatusBadge status={v} /> },
    { key: 'plan', label: 'Plan', render: v => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'fee_status', label: 'Fee', render: v => <StatusBadge status={v} /> },
    { key: 'approved', label: 'Status', render: (v, row) => <StatusBadge status={row.status || (v ? 'active' : 'pending')} /> },
    { key: 'profileCompletion', label: 'Profile', render: v => (
      <div style={{ width: 80 }}>
        <div style={{ height: 4, background: A.border, borderRadius: 2 }}>
          <div style={{ height:'100%', width:`${v||0}%`, background: v>=80 ? A.green : v>=50 ? A.gold : A.red, borderRadius:2 }} />
        </div>
        <span style={{ fontFamily:'IBM Plex Mono', fontSize:9, color:A.muted }}>{v||0}%</span>
      </div>
    )},
    { key: 'lastLogin', label: 'Last Login', render: v => <span style={{ fontFamily:'IBM Plex Mono', fontSize:10, color:A.muted }}>{v ? new Date(v).toLocaleDateString('en-IN') : '—'}</span> },
  ]

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <SectionHeader
        title="User Management"
        sub={`${filtered.length} of ${state.users.length} members`}
        actions={[
          <ABtn key="add" variant="primary" icon="+" onClick={() => setShowAdd(true)}>Add Member</ABtn>,
          <ABtn key="exp" variant="ghost" icon="⬇">Export CSV</ABtn>,
        ]}
      />

      {/* Filters */}
      <GlassCard style={{ padding: '1rem 1.2rem', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, city…" />
          <div style={{ minWidth: 130 }}>
            <AInput label="Tier" value={filterTier} onChange={setFilterTier} options={['standard','elite']} />
          </div>
          <div style={{ minWidth: 130 }}>
            <AInput label="Status" value={filterStatus} onChange={setFilterStatus} options={['approved','pending','suspended','unpaid']} />
          </div>
          <div style={{ minWidth: 130 }}>
            <AInput label="City" value={filterCity} onChange={setFilterCity} options={CITIES} />
          </div>
          <ABtn variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterTier(''); setFilterStatus(''); setFilterCity('') }}>Clear</ABtn>
        </div>
      </GlassCard>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: state.users.length, color: A.gold },
          { label: 'Active', value: state.users.filter(u=>u.status==='active').length, color: A.green },
          { label: 'Pending', value: state.users.filter(u=>!u.approved&&u.fee_status==='paid').length, color: A.orange },
          { label: 'Suspended', value: state.users.filter(u=>u.status==='suspended').length, color: A.red },
          { label: 'Elite', value: state.users.filter(u=>u.tier==='elite').length, color: A.purple },
        ].map(s => (
          <div key={s.label} style={{ background: s.color+'14', border:`1px solid ${s.color}33`, borderRadius:10, padding:'8px 16px', display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontFamily:'Cormorant Garamond', fontSize:'1.3rem', fontWeight:700, color:s.color }}>{s.value}</span>
            <span style={{ fontFamily:'IBM Plex Mono', fontSize:10, color:A.muted, letterSpacing:'0.08em', textTransform:'uppercase' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <GlassCard style={{ padding: '0.5rem 0' }}>
        <ATable columns={cols} rows={filtered} onRowClick={setSelected} />
      </GlassCard>

      {/* Profile drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:499 }}
            />
            <ProfileDrawer user={selected} onClose={() => setSelected(null)} onUpdate={re} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

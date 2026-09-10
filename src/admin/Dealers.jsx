import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ADMIN, state } from '../data.js'
import { ABtn, ABadge, StatusBadge, ATable, AModal, AInput, SearchBar, SectionHeader, GlassCard, GoldDivider, ProgressBar, StatCard, Toast } from './ui.jsx'

const A = ADMIN

function DealerDetail({ dealer, onClose, onUpdate }) {
  const [toast, setToast] = useState(null)
  if (!dealer) return null

  const members = state.users.filter(u => dealer.members.includes(u.id))
  const converted = members.filter(u => u.approved).length
  const convRate = dealer.members.length ? Math.round((converted / dealer.members.length) * 100) : 0
  const monthData = (dealer.monthlyRevenue || []).map((v, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    revenue: v,
  }))

  const toggle = () => {
    dealer.status = dealer.status === 'active' ? 'suspended' : 'active'
    state.adminLog.unshift({ id:`log${Date.now()}`, action: dealer.status==='active'?'activate_dealer':'suspend_dealer', entity:'Dealer', entityId:dealer.id, adminId:'admin', ip:'—', ts:new Date().toISOString() })
    onUpdate()
    setToast({ message: `Dealer ${dealer.status}`, type: dealer.status==='active'?'success':'error' })
  }

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 540, zIndex: 500,
        background: A.card, borderLeft: `1px solid ${A.borderGlow}`,
        boxShadow: `-20px 0 80px rgba(0,0,0,0.6)`, overflowY: 'auto',
      }}
    >
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ padding: '1.5rem', borderBottom: `1px solid ${A.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={onClose} style={{ background:'none', border:'none', color:A.muted, cursor:'pointer', fontSize:18 }}>✕</button>
          <div style={{ display:'flex', gap:8 }}>
            <ABtn size="sm" variant={dealer.status==='active'?'danger':'success'} onClick={toggle}>
              {dealer.status==='active'?'Suspend':'Activate'}
            </ABtn>
          </div>
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:A.gold+'22', border:`2px solid ${A.gold}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>🤝</div>
          <div>
            <h3 style={{ fontFamily:'Cormorant Garamond', fontSize:'1.4rem', fontWeight:700, color:A.text }}>{dealer.name}</h3>
            <p style={{ fontFamily:'IBM Plex Mono', fontSize:10, color:A.muted, letterSpacing:'0.08em' }}>{dealer.email} · {dealer.city}</p>
            <div style={{ display:'flex', gap:6, marginTop:6 }}>
              <StatusBadge status={dealer.status} />
              {dealer.verified && <ABadge color={A.cyan} dot>Verified</ABadge>}
              <ABadge color={A.gold}>{dealer.code}</ABadge>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          {[
            { label:'Total Members', value:dealer.members.length, color:A.gold },
            { label:'Converted', value:converted, color:A.green },
            { label:'Conversion Rate', value:`${convRate}%`, color:A.cyan },
            { label:'Commission %', value:`${dealer.commissionPct}%`, color:A.purple },
            { label:'Total Earned', value:`₹${dealer.totalEarned?.toLocaleString('en-IN')}`, color:A.gold },
            { label:'Pending', value:`₹${dealer.pendingCommission?.toLocaleString('en-IN')}`, color:A.orange },
          ].map(k => (
            <div key={k.label} style={{ background:A.panel, borderRadius:10, padding:'12px', border:`1px solid ${A.border}` }}>
              <p style={{ fontFamily:'Cormorant Garamond', fontSize:'1.3rem', fontWeight:700, color:k.color }}>{k.value}</p>
              <p style={{ fontFamily:'IBM Plex Mono', fontSize:9, color:A.muted, letterSpacing:'0.08em', textTransform:'uppercase', marginTop:2 }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <GoldDivider />
        <p style={{ fontFamily:'IBM Plex Mono', fontSize:10, color:A.muted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Monthly Revenue</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthData}>
            <CartesianGrid strokeDasharray="3 3" stroke={A.border} />
            <XAxis dataKey="month" tick={{ fill:A.muted, fontSize:9, fontFamily:'IBM Plex Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:A.muted, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ background:A.card, border:`1px solid ${A.border}`, borderRadius:8, fontSize:12 }} formatter={v=>[`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
            <Bar dataKey="revenue" fill={A.gold} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Members list */}
        <GoldDivider />
        <p style={{ fontFamily:'IBM Plex Mono', fontSize:10, color:A.muted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Referred Members ({members.length})</p>
        {members.map(u => (
          <div key={u.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:`1px solid ${A.border}22` }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:A.border, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
              {u.gender==='Female'?'👩':'👨'}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, color:A.text, fontWeight:500 }}>{u.name}</p>
              <p style={{ fontFamily:'IBM Plex Mono', fontSize:10, color:A.muted }}>{u.city} · {u.plan}</p>
            </div>
            <StatusBadge status={u.approved?'active':'pending'} />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function Dealers({ refresh }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newDealer, setNewDealer] = useState({ name:'', email:'', phone:'', city:'', code:'', commissionPct:8 })
  const [toast, setToast] = useState(null)
  const [, forceUpdate] = useState(0)
  const re = () => { forceUpdate(n=>n+1); refresh() }

  const filtered = useMemo(() => state.dealers.filter(d => {
    const q = search.toLowerCase()
    return !q || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
  }), [search, state.dealers.length])

  const addDealer = () => {
    const d = { ...newDealer, id:`d${Date.now()}`, status:'active', verified:false, totalEarned:0, pendingCommission:0, members:[], joinedAt:new Date().toISOString(), monthlyRevenue:Array(12).fill(0), documents:[], loginHistory:[] }
    state.dealers.push(d)
    setShowAdd(false)
    setNewDealer({ name:'', email:'', phone:'', city:'', code:'', commissionPct:8 })
    setToast({ message:'Dealer added successfully', type:'success' })
    re()
  }

  const cols = [
    { key:'name', label:'Dealer', render:(v,row) => (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:A.gold+'22', border:`1px solid ${A.gold}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤝</div>
        <div>
          <p style={{ fontWeight:600, color:A.text, fontSize:13 }}>{v}</p>
          <p style={{ fontFamily:'IBM Plex Mono', fontSize:10, color:A.muted }}>{row.email}</p>
        </div>
      </div>
    )},
    { key:'code', label:'Code', render:v => <ABadge color={A.gold}>{v}</ABadge> },
    { key:'city', label:'City', render:v => <span style={{ color:A.muted, fontSize:12 }}>{v}</span> },
    { key:'members', label:'Members', render:v => <span style={{ fontFamily:'IBM Plex Mono', fontSize:12, color:A.text }}>{v?.length || 0}</span> },
    { key:'totalEarned', label:'Earned', render:v => <span style={{ fontFamily:'IBM Plex Mono', fontSize:12, color:A.gold }}>₹{(v||0).toLocaleString('en-IN')}</span> },
    { key:'commissionPct', label:'Commission', render:v => <ABadge color={A.cyan}>{v}%</ABadge> },
    { key:'status', label:'Status', render:v => <StatusBadge status={v} /> },
    { key:'verified', label:'Verified', render:v => <StatusBadge status={v?'verified':'pending'} /> },
  ]

  // Leaderboard
  const leaderboard = [...state.dealers].sort((a,b) => b.totalEarned - a.totalEarned)

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <SectionHeader
        title="Dealer Management"
        sub={`${state.dealers.length} registered dealers`}
        actions={[
          <ABtn key="add" variant="primary" icon="+" onClick={() => setShowAdd(true)}>Add Dealer</ABtn>,
          <ABtn key="exp" variant="ghost" icon="⬇">Export</ABtn>,
        ]}
      />

      {/* Leaderboard */}
      <GlassCard style={{ padding:'1.5rem', marginBottom:24 }} glow>
        <p style={{ fontFamily:'Cormorant Garamond', fontSize:'1.2rem', fontWeight:700, color:A.text, marginBottom:16 }}>🏆 Dealer Leaderboard</p>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {leaderboard.map((d, i) => (
            <motion.div
              key={d.id}
              whileHover={{ y:-4 }}
              onClick={() => setSelected(d)}
              style={{
                flex:1, minWidth:160, background:i===0?A.gold+'14':A.panel, borderRadius:12,
                padding:'1rem', border:`1px solid ${i===0?A.gold+'44':A.border}`, cursor:'pointer',
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontFamily:'IBM Plex Mono', fontSize:18, color:[A.gold,'#C0C0C0','#CD7F32'][i]||A.muted }}>
                  {['🥇','🥈','🥉'][i]||`#${i+1}`}
                </span>
                <StatusBadge status={d.status} />
              </div>
              <p style={{ fontWeight:600, color:A.text, fontSize:13, marginBottom:2 }}>{d.name}</p>
              <p style={{ fontFamily:'IBM Plex Mono', fontSize:10, color:A.muted, marginBottom:8 }}>{d.city} · {d.code}</p>
              <p style={{ fontFamily:'Cormorant Garamond', fontSize:'1.3rem', fontWeight:700, color:A.gold }}>₹{(d.totalEarned||0).toLocaleString('en-IN')}</p>
              <p style={{ fontFamily:'IBM Plex Mono', fontSize:9, color:A.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>{d.members.length} members</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Search + table */}
      <GlassCard style={{ padding:'1rem 1.2rem', marginBottom:16 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search dealers…" />
      </GlassCard>
      <GlassCard style={{ padding:'0.5rem 0' }}>
        <ATable columns={cols} rows={filtered} onRowClick={setSelected} />
      </GlassCard>

      {/* Add dealer modal */}
      <AModal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Dealer">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <AInput label="Name" value={newDealer.name} onChange={v => setNewDealer(f=>({...f,name:v}))} />
          <AInput label="Email" value={newDealer.email} onChange={v => setNewDealer(f=>({...f,email:v}))} />
          <AInput label="Phone" value={newDealer.phone} onChange={v => setNewDealer(f=>({...f,phone:v}))} />
          <AInput label="City" value={newDealer.city} onChange={v => setNewDealer(f=>({...f,city:v}))} options={['Coimbatore','Salem','Erode','Tirupur','Namakkal','Dindigul']} />
          <AInput label="Promo Code" value={newDealer.code} onChange={v => setNewDealer(f=>({...f,code:v.toUpperCase()}))} />
          <AInput label="Commission %" type="number" value={String(newDealer.commissionPct)} onChange={v => setNewDealer(f=>({...f,commissionPct:Number(v)}))} />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
          <ABtn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</ABtn>
          <ABtn variant="primary" onClick={addDealer}>Add Dealer</ABtn>
        </div>
      </AModal>

      {/* Dealer detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setSelected(null)}
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:499 }} />
            <DealerDetail dealer={selected} onClose={() => setSelected(null)} onUpdate={re} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

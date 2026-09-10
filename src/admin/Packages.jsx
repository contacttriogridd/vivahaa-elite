import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ADMIN, state, PLANS } from '../data.js'
import { ABtn, ABadge, StatusBadge, AModal, AInput, SectionHeader, GlassCard, GoldDivider, Toast } from './ui.jsx'
const A = ADMIN
export default function Packages({ refresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState(null)
  const [, forceUpdate] = useState(0)
  const re = () => { forceUpdate(n => n + 1); refresh() }
  const allPlans = [...PLANS.standard, ...PLANS.elite]
  const [form, setForm] = useState({ name: '', price: '', duration: 30, tier: 'standard', features: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const add = () => {
    state.packages.push({ ...form, id: `pkg${Date.now()}`, price: Number(form.price), features: form.features.split(',').map(f => f.trim()) })
    setShowAdd(false); setToast({ message: 'Package created', type: 'success' }); re()
  }
  return (
    <div>
      {toast && <div style={{ position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:A.card,border:`1px solid ${A.green}44`,borderRadius:12,padding:'12px 20px',color:A.green,zIndex:9999,fontSize:13 }}>✓ {toast.message}</div>}
      <SectionHeader title="Package Management" sub={`${allPlans.length} packages`} actions={[<ABtn key="a" variant="primary" icon="+" onClick={() => setShowAdd(true)}>New Package</ABtn>]} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
        {allPlans.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay: i*0.08 }}
            whileHover={{ y:-4, boxShadow:`0 20px 60px ${A.gold}22` }}
            style={{ background: A.gradientCard, border:`1px solid ${p.id.includes('platinum') ? A.gold+'66' : A.border}`, borderRadius:16, padding:'1.5rem', position:'relative', overflow:'hidden' }}>
            {p.id.includes('platinum') && <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${A.gold},transparent)` }} />}
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12 }}>
              <div>
                <p style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.gold,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4 }}>{p.id.includes('platinum')?'Elite':'Standard'}</p>
                <h3 style={{ fontFamily:'Cormorant Garamond',fontSize:'1.4rem',fontWeight:700,color:A.text }}>{p.name}</h3>
              </div>
              <ABadge color={p.id.includes('platinum')?A.gold:A.blue}>{p.id.includes('platinum')?'Elite':'Standard'}</ABadge>
            </div>
            <p style={{ fontFamily:'Cormorant Garamond',fontSize:'2.2rem',fontWeight:700,color:A.gold,marginBottom:4 }}>₹{p.price?.toLocaleString('en-IN')}</p>
            <p style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.muted,marginBottom:16 }}>/month · {p.duration||30} days</p>
            <GoldDivider />
            <ul style={{ listStyle:'none',marginBottom:16 }}>
              {(p.features||[]).map(f => <li key={f} style={{ fontSize:12,color:A.muted,padding:'4px 0',borderBottom:`1px solid ${A.border}22` }}>✦ {f}</li>)}
            </ul>
            <div style={{ display:'flex',gap:8 }}>
              <ABtn size="sm" variant="outline">Edit</ABtn>
              <ABtn size="sm" variant="ghost">Coupons</ABtn>
              <ABtn size="sm" variant="danger">Delete</ABtn>
            </div>
            <div style={{ marginTop:12,padding:'8px 12px',background:A.panel,borderRadius:8,display:'flex',justifyContent:'space-between' }}>
              <span style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.muted }}>Active subscribers</span>
              <span style={{ fontFamily:'IBM Plex Mono',fontSize:11,color:A.gold,fontWeight:600 }}>{state.users.filter(u=>u.plan===p.id&&u.fee_status==='paid').length}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <AModal open={showAdd} onClose={() => setShowAdd(false)} title="Create New Package">
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px' }}>
          <AInput label="Package Name" value={form.name} onChange={v => set('name',v)} />
          <AInput label="Price (₹)" type="number" value={String(form.price)} onChange={v => set('price',v)} />
          <AInput label="Duration (days)" type="number" value={String(form.duration)} onChange={v => set('duration',Number(v))} />
          <AInput label="Tier" value={form.tier} onChange={v => set('tier',v)} options={['standard','elite']} />
        </div>
        <AInput label="Features (comma separated)" value={form.features} onChange={v => set('features',v)} />
        <div style={{ display:'flex',gap:8,justifyContent:'flex-end',marginTop:8 }}>
          <ABtn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</ABtn>
          <ABtn variant="primary" onClick={add}>Create Package</ABtn>
        </div>
      </AModal>
    </div>
  )
}

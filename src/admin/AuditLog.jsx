import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ADMIN, state } from '../data.js'
import { ABadge, SearchBar, SectionHeader, GlassCard } from './ui.jsx'
const A = ADMIN
const ACTION_COLORS = { approve_user:A.green, reject_user:A.red, suspend_user:A.red, activate_user:A.green, edit_user:A.blue, approve_vendor:A.green, suspend_vendor:A.red, edit_package:A.orange, add_dealer:A.cyan, remove_dealer:A.red, dispatch_gift:A.purple, generate_report:A.gold, login:A.blue, logout:A.muted, bulk_export:A.orange }
export default function AuditLog() {
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const filtered = useMemo(() => state.adminLog.filter(l => {
    const q = search.toLowerCase()
    if (q && !l.action.includes(q) && !l.entity?.toLowerCase().includes(q) && !l.entityId?.toLowerCase().includes(q)) return false
    if (filterAction && l.action !== filterAction) return false
    return true
  }), [search, filterAction, state.adminLog.length])
  const actions = [...new Set(state.adminLog.map(l => l.action))]
  return (
    <div>
      <SectionHeader title="Audit Log" sub={`${state.adminLog.length} total entries`} />
      <GlassCard style={{ padding:'1rem 1.2rem',marginBottom:16 }}>
        <div style={{ display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search actions, entities…" />
          <select value={filterAction} onChange={e=>setFilterAction(e.target.value)} style={{ padding:'9px 12px',borderRadius:8,background:A.panel,color:A.text,border:`1px solid ${A.border}`,fontFamily:'Inter',fontSize:13,outline:'none',minWidth:180 }}>
            <option value="">All Actions</option>
            {actions.map(a=><option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </GlassCard>
      <GlassCard style={{ padding:'1rem' }}>
        <div style={{ display:'grid',gridTemplateColumns:'auto 1fr auto auto auto',gap:'0 16px',padding:'8px 14px',borderBottom:`1px solid ${A.border}`,marginBottom:4 }}>
          {['','Action','Entity','Admin','Time'].map(h=><span key={h} style={{ fontFamily:'IBM Plex Mono',fontSize:9,color:A.muted,letterSpacing:'0.1em',textTransform:'uppercase' }}>{h}</span>)}
        </div>
        {filtered.map((log,i)=>(
          <motion.div key={log.id} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.02 }}
            style={{ display:'grid',gridTemplateColumns:'auto 1fr auto auto auto',gap:'0 16px',padding:'10px 14px',borderBottom:`1px solid ${A.border}11`,alignItems:'center' }}
            whileHover={{ backgroundColor:A.border+'22' }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:ACTION_COLORS[log.action]||A.muted }} />
            <div>
              <span style={{ fontFamily:'IBM Plex Mono',fontSize:11,color:ACTION_COLORS[log.action]||A.muted,textTransform:'uppercase',letterSpacing:'0.06em' }}>{log.action.replace(/_/g,' ')}</span>
            </div>
            <span style={{ fontSize:12,color:A.muted }}>{log.entity} <span style={{ color:A.text }}>{log.entityId}</span></span>
            <span style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.subtle }}>{log.adminId}</span>
            <span style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.subtle,whiteSpace:'nowrap' }}>{new Date(log.ts).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
          </motion.div>
        ))}
        {filtered.length===0&&<div style={{ textAlign:'center',padding:'3rem',color:A.muted,fontStyle:'italic' }}>No log entries found</div>}
      </GlassCard>
    </div>
  )
}

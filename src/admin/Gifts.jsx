import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ADMIN, state } from '../data.js'
import { ABtn, ABadge, StatusBadge, ATable, AModal, AInput, SectionHeader, GlassCard, GoldDivider, Toast } from './ui.jsx'
const A = ADMIN
export default function Gifts({ refresh }) {
  const [tab, setTab] = useState('inventory')
  const [toast, setToast] = useState(null)
  const [, forceUpdate] = useState(0)
  const re = () => { forceUpdate(n => n + 1); refresh() }
  const stdGifts = state.gifts.filter(g => g.type === 'standard')
  const eliteGifts = state.gifts.filter(g => g.type === 'elite')
  const dispatch = (gift) => { gift.dispatched = (gift.dispatched||0)+1; gift.stock = Math.max(0,(gift.stock||0)-1); setToast({ message:`${gift.name} dispatched!`,type:'success' }); re() }
  return (
    <div>
      {toast && <div style={{ position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:A.card,border:`1px solid ${A.green}44`,borderRadius:12,padding:'12px 20px',color:A.green,zIndex:9999,fontSize:13 }}>✓ {toast.message}</div>}
      <SectionHeader title="Gift Management" sub="Wedding completion gifts for Standard & Elite members" />
      <div style={{ display:'flex',gap:8,marginBottom:24,borderBottom:`1px solid ${A.border}`,paddingBottom:8 }}>
        {['inventory','dispatch','history'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ fontFamily:'IBM Plex Mono',fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',padding:'8px 16px',border:'none',cursor:'pointer',borderRadius:'8px 8px 0 0',background:tab===t?A.gold+'18':'transparent',color:tab===t?A.gold:A.muted,borderBottom:tab===t?`2px solid ${A.gold}`:'2px solid transparent',transition:'all 0.2s' }}>{t}</button>
        ))}
      </div>
      {tab === 'inventory' && (
        <div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:24 }}>
            {/* Standard */}
            <GlassCard style={{ padding:'1.5rem' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
                <div style={{ width:36,height:36,borderRadius:10,background:A.blue+'22',border:`1px solid ${A.blue}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>🎁</div>
                <div>
                  <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.1rem',fontWeight:700,color:A.text }}>Standard Gifts</p>
                  <p style={{ fontFamily:'IBM Plex Mono',fontSize:9,color:A.muted,letterSpacing:'0.1em',textTransform:'uppercase' }}>For Standard Members</p>
                </div>
              </div>
              {stdGifts.map((g,i) => (
                <motion.div key={g.id} initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.06 }}
                  style={{ background:A.panel,borderRadius:10,padding:'12px',marginBottom:10,border:`1px solid ${A.border}` }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                    <p style={{ fontSize:13,fontWeight:600,color:A.text }}>{g.name}</p>
                    <ABadge color={A.blue}>₹{g.value?.toLocaleString('en-IN')}</ABadge>
                  </div>
                  <p style={{ fontSize:11,color:A.muted,marginBottom:8 }}>{g.description}</p>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <div style={{ display:'flex',gap:12 }}>
                      <span style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.green }}>Stock: {g.stock}</span>
                      <span style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.gold }}>Sent: {g.dispatched}</span>
                    </div>
                    <ABtn size="sm" variant="success" onClick={() => dispatch(g)}>Dispatch</ABtn>
                  </div>
                </motion.div>
              ))}
            </GlassCard>
            {/* Elite */}
            <GlassCard style={{ padding:'1.5rem',border:`1px solid ${A.gold}44` }} glow>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
                <div style={{ width:36,height:36,borderRadius:10,background:A.gold+'22',border:`1px solid ${A.gold}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>♛</div>
                <div>
                  <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.1rem',fontWeight:700,color:A.gold }}>Elite Gifts</p>
                  <p style={{ fontFamily:'IBM Plex Mono',fontSize:9,color:A.muted,letterSpacing:'0.1em',textTransform:'uppercase' }}>For Elite Members</p>
                </div>
              </div>
              {eliteGifts.map((g,i) => (
                <motion.div key={g.id} initial={{ opacity:0,x:10 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.06 }}
                  style={{ background:`linear-gradient(135deg,${A.gold}08,${A.panel})`,borderRadius:10,padding:'12px',marginBottom:10,border:`1px solid ${A.gold}22` }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                    <p style={{ fontSize:13,fontWeight:600,color:A.text }}>{g.name}</p>
                    <ABadge color={A.gold}>₹{g.value?.toLocaleString('en-IN')}</ABadge>
                  </div>
                  <p style={{ fontSize:11,color:A.muted,marginBottom:8 }}>{g.description}</p>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <div style={{ display:'flex',gap:12 }}>
                      <span style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.green }}>Stock: {g.stock}</span>
                      <span style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.gold }}>Sent: {g.dispatched}</span>
                    </div>
                    <ABtn size="sm" variant="primary" onClick={() => dispatch(g)}>Dispatch</ABtn>
                  </div>
                </motion.div>
              ))}
            </GlassCard>
          </div>
        </div>
      )}
      {tab === 'dispatch' && (
        <GlassCard style={{ padding:'1.5rem' }}>
          <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>Dispatch Gift</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px' }}>
            <AInput label="Member Name / ID" value="" onChange={() => {}} placeholder="Search member…" />
            <AInput label="Gift Package" value="" onChange={() => {}} options={state.gifts.map(g=>g.name)} />
            <AInput label="Courier Partner" value="" onChange={() => {}} options={['BlueDart','DTDC','FedEx','India Post','Delhivery']} />
            <AInput label="Tracking Number" value="" onChange={() => {}} placeholder="AWB number…" />
          </div>
          <ABtn variant="primary" icon="📦">Dispatch Gift</ABtn>
        </GlassCard>
      )}
      {tab === 'history' && (
        <GlassCard style={{ padding:'1.5rem' }}>
          <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>Gift Dispatch History</p>
          {state.successStories.map((s,i) => (
            <div key={s.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${A.border}22` }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:s.giftDispatched?A.green:A.orange,flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13,color:A.text,fontWeight:500 }}>{s.names}</p>
                <p style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.muted }}>{s.city} · {s.tier} · {s.year}</p>
              </div>
              <ABadge color={s.tier==='elite'?A.gold:A.blue}>{s.giftType}</ABadge>
              <StatusBadge status={s.giftDispatched?'active':'pending'} />
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  )
}

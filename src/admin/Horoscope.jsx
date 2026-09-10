import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ADMIN, state } from '../data.js'
import { ABtn, ABadge, AInput, SectionHeader, GlassCard, GoldDivider, ProgressBar } from './ui.jsx'
const A = ADMIN
function computeMatch(u1, u2) {
  if (!u1||!u2) return 0
  const checks = [u1.nakshatra!==u2.nakshatra,u1.rashi!==u2.rashi,u1.gender!==u2.gender,u1.dosham===u2.dosham,u1.caste===u2.caste,true,true,u1.nakshatra!==u2.nakshatra,u1.rashi!==u2.rashi,u1.birthPlace!==u2.birthPlace]
  return checks.filter(Boolean).length
}
export default function Horoscope() {
  const [u1id, setU1id] = useState('')
  const [u2id, setU2id] = useState('')
  const [zoom, setZoom] = useState(1)
  const [rotate, setRotate] = useState(0)
  const approved = state.users.filter(u => u.approved)
  const u1 = approved.find(u => u.id === u1id)
  const u2 = approved.find(u => u.id === u2id)
  const score = u1 && u2 ? computeMatch(u1, u2) : 0
  const pct = Math.round((score/10)*100)
  const PORUTHAMS = ['Dina','Gana','Mahendra','Stree Deergha','Yoni','Rashi','Rasyadhipati','Vasya','Rajju','Vedha']
  return (
    <div>
      <SectionHeader title="Horoscope Management" sub="View, compare and analyse member horoscopes" />
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24 }}>
        {[{label:'Member 1',val:u1id,set:setU1id,user:u1},{label:'Member 2',val:u2id,set:setU2id,user:u2}].map(({label,val,set,user},idx) => (
          <GlassCard key={idx} style={{ padding:'1.5rem' }}>
            <p style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8 }}>{label}</p>
            <AInput label="Select Member" value={val} onChange={set} options={approved.map(u=>u.id)} />
            {user && (
              <div>
                <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:4 }}>{user.name}</p>
                {[['Nakshatra',user.nakshatra],['Rashi',user.rashi],['Birth Time',user.birthTime],['Birth Place',user.birthPlace],['Dosham',user.dosham]].map(([k,v])=>(
                  <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:`1px solid ${A.border}22`,fontSize:12 }}>
                    <span style={{ color:A.muted }}>{k}</span><span style={{ color:A.text,fontWeight:500 }}>{v||'—'}</span>
                  </div>
                ))}
                <GoldDivider />
                <div style={{ background:A.panel,borderRadius:10,padding:'1rem',textAlign:'center',border:`1px dashed ${A.border}` }}>
                  <p style={{ fontSize:28,marginBottom:6 }}>☽</p>
                  <p style={{ fontSize:11,color:A.muted,fontStyle:'italic' }}>Jadhagam Chart</p>
                  {user.chartPhoto
                    ? <img src={user.chartPhoto} alt="chart" style={{ maxWidth:'100%',borderRadius:8,marginTop:8,transform:`scale(${zoom}) rotate(${rotate}deg)`,transition:'transform 0.3s' }} />
                    : <p style={{ fontSize:11,color:A.subtle,marginTop:6 }}>No chart uploaded</p>
                  }
                  <div style={{ display:'flex',gap:6,justifyContent:'center',marginTop:10,flexWrap:'wrap' }}>
                    <ABtn size="sm" variant="ghost" onClick={()=>setZoom(z=>Math.min(z+0.2,3))}>🔍+</ABtn>
                    <ABtn size="sm" variant="ghost" onClick={()=>setZoom(z=>Math.max(z-0.2,0.5))}>🔍-</ABtn>
                    <ABtn size="sm" variant="ghost" onClick={()=>setRotate(r=>r+90)}>↻</ABtn>
                    <ABtn size="sm" variant="ghost">⬇ Download</ABtn>
                    <ABtn size="sm" variant="ghost">🖨 Print</ABtn>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
      {u1 && u2 && (
        <GlassCard style={{ padding:'1.5rem' }} glow>
          <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.4rem',fontWeight:700,color:A.text,marginBottom:4,textAlign:'center' }}>Compatibility Analysis</p>
          <p style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.muted,letterSpacing:'0.1em',textAlign:'center',marginBottom:20 }}>AI-ASSISTED · CONSULT A QUALIFIED JYOTISHI FOR BINDING DECISIONS</p>
          <div style={{ display:'flex',justifyContent:'center',marginBottom:24 }}>
            <div style={{ position:'relative',width:140,height:140 }}>
              <svg width={140} height={140} viewBox="0 0 140 140">
                <circle cx={70} cy={70} r={58} fill="none" stroke={A.border} strokeWidth={12}/>
                <circle cx={70} cy={70} r={58} fill="none" stroke={pct>=70?A.green:pct>=50?A.gold:A.red} strokeWidth={12}
                  strokeDasharray={`${(pct/100)*364.4} 364.4`} strokeLinecap="round" transform="rotate(-90 70 70)"
                  style={{ transition:'stroke-dasharray 1s ease' }}/>
                <text x={70} y={64} textAnchor="middle" fill={A.text} style={{ fontFamily:'Cormorant Garamond',fontSize:28,fontWeight:700 }}>{score}</text>
                <text x={70} y={82} textAnchor="middle" fill={A.muted} style={{ fontFamily:'IBM Plex Mono',fontSize:11 }}>/ 10</text>
              </svg>
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:20 }}>
            {PORUTHAMS.map((p,i) => {
              const pass = i < score
              return (
                <div key={p} style={{ background:pass?A.green+'18':A.red+'18',border:`1px solid ${pass?A.green:A.red}44`,borderRadius:8,padding:'8px',textAlign:'center' }}>
                  <p style={{ fontSize:16,marginBottom:4 }}>{pass?'✓':'✗'}</p>
                  <p style={{ fontFamily:'IBM Plex Mono',fontSize:9,color:pass?A.green:A.red,letterSpacing:'0.06em' }}>{p}</p>
                </div>
              )
            })}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            {[['Compatibility Score',`${pct}%`,pct>=70?A.green:pct>=50?A.gold:A.red],['Porutham Count',`${score}/10`,A.gold],['Dosham Match',u1.dosham===u2.dosham?'Compatible':'Check Required',u1.dosham===u2.dosham?A.green:A.orange],['Rashi Compatibility',u1.rashi!==u2.rashi?'Good':'Needs Review',u1.rashi!==u2.rashi?A.green:A.orange]].map(([k,v,c])=>(
              <div key={k} style={{ background:A.panel,borderRadius:10,padding:'12px',border:`1px solid ${A.border}` }}>
                <p style={{ fontFamily:'IBM Plex Mono',fontSize:9,color:A.muted,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>{k}</p>
                <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:c }}>{v}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

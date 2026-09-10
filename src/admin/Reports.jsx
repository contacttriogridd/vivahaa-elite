import React, { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ADMIN, state } from '../data.js'
import { ABtn, ABadge, SectionHeader, GlassCard, GoldDivider, StatCard } from './ui.jsx'
const A = ADMIN
const TT = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return <div style={{ background:A.card,border:`1px solid ${A.border}`,borderRadius:10,padding:'10px 14px' }}><p style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.muted,marginBottom:6 }}>{label}</p>{payload.map(p=><p key={p.name} style={{ fontSize:12,color:p.color }}>₹{Number(p.value).toLocaleString('en-IN')}</p>)}</div>
}
export default function Reports() {
  const [tab, setTab] = useState('revenue')
  const tabs = ['revenue','users','dealers','vendors','marriages','packages']
  const totalRev = state.monthlyRevenue.reduce((s,m)=>s+m.total,0)
  const totalElite = state.monthlyRevenue.reduce((s,m)=>s+m.elite,0)
  const totalStd = state.monthlyRevenue.reduce((s,m)=>s+m.standard,0)
  const cityData = ['Coimbatore','Salem','Erode','Tirupur','Namakkal','Dindigul'].map(c=>({ city:c, users:state.users.filter(u=>u.city===c).length, revenue:state.users.filter(u=>u.city===c&&u.fee_status==='paid').length*(u=>u.plan==='platinum'?1499:u.plan==='platinumplus'?2499:u.plan==='diamond'?899:u.plan==='gold'?699:499) }))
  const planColors = { silver:'#94A3B8', gold:A.gold, diamond:A.cyan, platinum:A.purple, platinumplus:A.orange }
  const planData = Object.entries(planColors).map(([id,color])=>({ name:id, value:state.users.filter(u=>u.plan===id).length, color }))
  return (
    <div>
      <SectionHeader title="Reports & Analytics" sub="Comprehensive business intelligence"
        actions={[<ABtn key="pdf" variant="outline" icon="📄">PDF</ABtn>,<ABtn key="xls" variant="ghost" icon="📊">Excel</ABtn>,<ABtn key="csv" variant="ghost" icon="📋">CSV</ABtn>]} />
      <div style={{ display:'flex',gap:4,marginBottom:24,borderBottom:`1px solid ${A.border}`,paddingBottom:8,flexWrap:'wrap' }}>
        {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{ fontFamily:'IBM Plex Mono',fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',padding:'8px 16px',border:'none',cursor:'pointer',borderRadius:'8px 8px 0 0',background:tab===t?A.gold+'18':'transparent',color:tab===t?A.gold:A.muted,borderBottom:tab===t?`2px solid ${A.gold}`:'2px solid transparent',transition:'all 0.2s' }}>{t}</button>)}
      </div>
      {tab==='revenue' && (
        <div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16,marginBottom:24 }}>
            <StatCard icon="₹" label="Total Revenue" value={`₹${(totalRev/100000).toFixed(1)}L`} color={A.gold} />
            <StatCard icon="♛" label="Elite Revenue" value={`₹${(totalElite/100000).toFixed(1)}L`} color={A.purple} />
            <StatCard icon="◉" label="Standard Revenue" value={`₹${(totalStd/100000).toFixed(1)}L`} color={A.blue} />
            <StatCard icon="🤝" label="Dealer Revenue" value={`₹${(state.monthlyRevenue.reduce((s,m)=>s+m.dealer,0)/1000).toFixed(0)}K`} color={A.orange} />
          </div>
          <GlassCard style={{ padding:'1.5rem',marginBottom:20 }}>
            <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>Monthly Revenue Breakdown</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={state.monthlyRevenue}>
                <defs>
                  {[['e',A.gold],['s',A.blue],['d',A.orange],['v',A.cyan]].map(([k,c])=>(
                    <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.3}/><stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={A.border}/>
                <XAxis dataKey="month" tick={{ fill:A.muted,fontSize:10,fontFamily:'IBM Plex Mono' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:A.muted,fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="elite" name="Elite" stroke={A.gold} fill="url(#ge)" strokeWidth={2}/>
                <Area type="monotone" dataKey="standard" name="Standard" stroke={A.blue} fill="url(#gs)" strokeWidth={2}/>
                <Area type="monotone" dataKey="dealer" name="Dealer" stroke={A.orange} fill="url(#gd)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      )}
      {tab==='users' && (
        <div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
            <GlassCard style={{ padding:'1.5rem' }}>
              <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>Users by City</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cityData} layout="vertical">
                  <XAxis type="number" tick={{ fill:A.muted,fontSize:9 }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="city" tick={{ fill:A.muted,fontSize:10,fontFamily:'IBM Plex Mono' }} axisLine={false} tickLine={false} width={80}/>
                  <Tooltip contentStyle={{ background:A.card,border:`1px solid ${A.border}`,borderRadius:8,fontSize:12 }}/>
                  <Bar dataKey="users" fill={A.gold} radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
            <GlassCard style={{ padding:'1.5rem' }}>
              <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>Plan Distribution</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {planData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background:A.card,border:`1px solid ${A.border}`,borderRadius:8,fontSize:12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginTop:8 }}>
                {planData.map(p=><div key={p.name} style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:8,height:8,borderRadius:'50%',background:p.color }}/><span style={{ fontFamily:'IBM Plex Mono',fontSize:9,color:A.muted }}>{p.name}({p.value})</span></div>)}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
      {tab==='dealers' && (
        <GlassCard style={{ padding:'1.5rem' }}>
          <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>Dealer Performance</p>
          {state.dealers.map((d,i)=>(
            <div key={d.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${A.border}22` }}>
              <span style={{ fontFamily:'IBM Plex Mono',fontSize:14,color:[A.gold,'#C0C0C0','#CD7F32'][i]||A.muted }}>{['🥇','🥈','🥉'][i]||`#${i+1}`}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13,color:A.text,fontWeight:500 }}>{d.name}</p>
                <p style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.muted }}>{d.city} · {d.members.length} members</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontFamily:'IBM Plex Mono',fontSize:12,color:A.gold }}>₹{(d.totalEarned||0).toLocaleString('en-IN')}</p>
                <p style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.muted }}>{d.commissionPct}% comm</p>
              </div>
            </div>
          ))}
        </GlassCard>
      )}
      {(tab==='vendors'||tab==='marriages'||tab==='packages') && (
        <GlassCard style={{ padding:'3rem',textAlign:'center' }}>
          <p style={{ fontSize:40,marginBottom:12 }}>📊</p>
          <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.4rem',color:A.text,marginBottom:8 }}>{tab.charAt(0).toUpperCase()+tab.slice(1)} Report</p>
          <p style={{ color:A.muted,fontSize:13 }}>Detailed {tab} analytics available. Export to PDF, Excel or CSV.</p>
          <div style={{ display:'flex',gap:8,justifyContent:'center',marginTop:16 }}>
            <ABtn variant="primary" icon="📄">Generate PDF Report</ABtn>
            <ABtn variant="ghost" icon="📊">Export Excel</ABtn>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { ADMIN } from '../data.js'
import { ABtn, AInput, SectionHeader, GlassCard, GoldDivider } from './ui.jsx'
const A = ADMIN
export default function Settings() {
  const [tab, setTab] = useState('general')
  const tabs = ['general','security','commissions','notifications','branding']
  const [comm, setComm] = useState({ dealer:8, vendor:10, referral:5, weddingBonus:2000 })
  const [toast, setToast] = useState('')
  const save = () => { setToast('Settings saved!'); setTimeout(()=>setToast(''),2500) }
  return (
    <div>
      {toast && <div style={{ position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:A.card,border:`1px solid ${A.green}44`,borderRadius:12,padding:'12px 20px',color:A.green,zIndex:9999,fontSize:13 }}>✓ {toast}</div>}
      <SectionHeader title="Settings" sub="System configuration and preferences" />
      <div style={{ display:'flex',gap:4,marginBottom:24,borderBottom:`1px solid ${A.border}`,paddingBottom:8,flexWrap:'wrap' }}>
        {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{ fontFamily:'IBM Plex Mono',fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',padding:'8px 16px',border:'none',cursor:'pointer',borderRadius:'8px 8px 0 0',background:tab===t?A.gold+'18':'transparent',color:tab===t?A.gold:A.muted,borderBottom:tab===t?`2px solid ${A.gold}`:'2px solid transparent',transition:'all 0.2s' }}>{t}</button>)}
      </div>
      {tab==='general' && (
        <GlassCard style={{ padding:'1.5rem',maxWidth:600 }}>
          <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>General Settings</p>
          <AInput label="Platform Name" value="Vivahaa Elite Matrimony" onChange={()=>{}} />
          <AInput label="Support Email" value="support@vivahaaelite.com" onChange={()=>{}} />
          <AInput label="Support Phone" value="+91 98765 43210" onChange={()=>{}} />
          <AInput label="Default Currency" value="INR" onChange={()=>{}} options={['INR','USD','GBP']} />
          <AInput label="Timezone" value="Asia/Kolkata" onChange={()=>{}} options={['Asia/Kolkata','UTC','Asia/Dubai']} />
          <ABtn variant="primary" onClick={save}>Save Changes</ABtn>
        </GlassCard>
      )}
      {tab==='security' && (
        <GlassCard style={{ padding:'1.5rem',maxWidth:600 }}>
          <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>Security Settings</p>
          {[['Session Timeout','30 minutes'],['Max Login Attempts','5'],['Password Min Length','8'],['2FA','Disabled']].map(([k,v])=>(
            <div key={k} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:`1px solid ${A.border}22` }}>
              <span style={{ fontSize:13,color:A.text }}>{k}</span>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ fontFamily:'IBM Plex Mono',fontSize:12,color:A.gold }}>{v}</span>
                <ABtn size="sm" variant="ghost">Edit</ABtn>
              </div>
            </div>
          ))}
          <div style={{ marginTop:16 }}>
            <p style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8 }}>Role Permissions</p>
            {[['Super Admin','Full Access'],['Admin','Manage Users, Dealers, Vendors'],['Moderator','View & Approve Only']].map(([role,perms])=>(
              <div key={role} style={{ background:A.panel,borderRadius:8,padding:'10px 12px',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div><p style={{ fontSize:13,color:A.text,fontWeight:500 }}>{role}</p><p style={{ fontSize:11,color:A.muted }}>{perms}</p></div>
                <ABtn size="sm" variant="outline">Edit</ABtn>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
      {tab==='commissions' && (
        <GlassCard style={{ padding:'1.5rem',maxWidth:600 }}>
          <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>Commission Configuration</p>
          <AInput label="Dealer Commission %" type="number" value={String(comm.dealer)} onChange={v=>setComm(c=>({...c,dealer:Number(v)}))} />
          <AInput label="Vendor Commission %" type="number" value={String(comm.vendor)} onChange={v=>setComm(c=>({...c,vendor:Number(v)}))} />
          <AInput label="Referral Commission %" type="number" value={String(comm.referral)} onChange={v=>setComm(c=>({...c,referral:Number(v)}))} />
          <AInput label="Wedding Completion Bonus (₹)" type="number" value={String(comm.weddingBonus)} onChange={v=>setComm(c=>({...c,weddingBonus:Number(v)}))} />
          <GoldDivider />
          <div style={{ background:A.panel,borderRadius:10,padding:'1rem',marginBottom:16 }}>
            <p style={{ fontFamily:'IBM Plex Mono',fontSize:10,color:A.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8 }}>Commission Calculator</p>
            <p style={{ fontSize:13,color:A.text }}>On ₹1,499 Platinum plan:</p>
            <p style={{ fontFamily:'IBM Plex Mono',fontSize:12,color:A.gold,marginTop:4 }}>Dealer earns: ₹{Math.round(1499*comm.dealer/100)} · Vendor earns: ₹{Math.round(1499*comm.vendor/100)}</p>
          </div>
          <ABtn variant="primary" onClick={save}>Save Commission Settings</ABtn>
        </GlassCard>
      )}
      {tab==='notifications' && (
        <GlassCard style={{ padding:'1.5rem',maxWidth:600 }}>
          <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>Notification Settings</p>
          {[['Email on Registration','Enabled'],['Email on Approval','Enabled'],['SMS on Match','Enabled'],['Renewal Reminder (7 days)','Enabled'],['Renewal Reminder (1 day)','Enabled'],['Gift Dispatch Alert','Enabled']].map(([k,v])=>(
            <div key={k} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${A.border}22` }}>
              <span style={{ fontSize:13,color:A.text }}>{k}</span>
              <div style={{ width:40,height:22,borderRadius:11,background:A.green+'44',border:`1px solid ${A.green}66`,display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'0 3px',cursor:'pointer' }}>
                <div style={{ width:16,height:16,borderRadius:'50%',background:A.green }} />
              </div>
            </div>
          ))}
          <ABtn variant="primary" style={{ marginTop:16 }} onClick={save}>Save</ABtn>
        </GlassCard>
      )}
      {tab==='branding' && (
        <GlassCard style={{ padding:'1.5rem',maxWidth:600 }}>
          <p style={{ fontFamily:'Cormorant Garamond',fontSize:'1.2rem',fontWeight:700,color:A.text,marginBottom:16 }}>Branding</p>
          {[['Primary Color','#7A2436'],['Gold Accent','#D9B24C'],['Elite Background','#0B0A09'],['Standard Background','#FBF7F0']].map(([k,v])=>(
            <div key={k} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${A.border}22` }}>
              <span style={{ fontSize:13,color:A.text }}>{k}</span>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ width:24,height:24,borderRadius:6,background:v,border:`1px solid ${A.border}` }} />
                <span style={{ fontFamily:'IBM Plex Mono',fontSize:11,color:A.muted }}>{v}</span>
              </div>
            </div>
          ))}
          <ABtn variant="primary" style={{ marginTop:16 }} onClick={save}>Save Branding</ABtn>
        </GlassCard>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { STD, CITIES, NAKSHATRAS, RASHIS, PLANS, state } from './data.js'
import { Divider, Btn, Card, Badge, Input } from './components.jsx'

const t = STD

export default function Dealer({ dealer, refresh }) {
  const [tab, setTab] = useState('members')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', gender: 'Male', dob: '', city: '',
    education: '', occupation: '', income: '', tier: 'standard', plan: 'gold',
    nakshatra: '', rashi: '', caste: 'Iyer',
  })
  const [added, setAdded] = useState(false)
  const [, forceUpdate] = useState(0)
  const re = () => { forceUpdate(n => n + 1); refresh() }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const members = state.users.filter(u => dealer.members.includes(u.id))

  const registerMember = () => {
    const newUser = {
      ...form, id: 'u' + Date.now(),
      dealerCode: dealer.code, fee_status: 'paid', approved: false,
      assets: { property: '', vehicle: '', savings: '' },
      hobbies: [], partnerExpectation: '', siblings: [],
      photo: null, chartPhoto: null, interests: [], coupons: [],
      birthTime: '', birthPlace: '',
    }
    state.users.push(newUser)
    dealer.members.push(newUser.id)
    setAdded(true)
    re()
    setTimeout(() => setAdded(false), 3000)
  }

  return (
    <div style={{ background: t.bg, minHeight: '100vh', color: t.text, padding: '2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', color: t.primary, marginBottom: 4 }}>
          Dealer Portal
        </h2>
        <Divider />

        {/* Dealer info */}
        <Card style={{ marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 16, color: t.text }}>{dealer.name}</p>
            <p style={{ fontSize: 13, color: t.muted }}>{dealer.email} · {dealer.city}</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your Promo Code</p>
            <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', fontWeight: 700, color: t.gold }}>{dealer.code}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Members Referred</p>
            <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', fontWeight: 700, color: t.primary }}>{dealer.members.length}</p>
          </div>
        </Card>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${t.border}`, paddingBottom: 8 }}>
          {['members', 'register'].map(tb => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: tab === tb ? t.primary : 'transparent',
              color: tab === tb ? '#fff' : t.muted,
            }}>{tb === 'register' ? 'Register New Member' : 'My Members'}</button>
          ))}
        </div>

        {tab === 'members' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', color: t.primary, marginBottom: 12 }}>
              Members Under {dealer.code} ({members.length})
            </h3>
            {members.length === 0 && <p style={{ color: t.muted, fontStyle: 'italic' }}>No members yet. Register one below.</p>}
            {members.map(u => (
              <Card key={u.id} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <p style={{ fontWeight: 600, color: t.text }}>{u.name}</p>
                  <p style={{ fontSize: 13, color: t.muted }}>{u.email} · {u.city} · {u.plan}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Badge color={u.approved ? '#4CAF50' : '#E53935'}>{u.approved ? 'Approved' : 'Pending'}</Badge>
                  <Badge color={u.tier === 'elite' ? '#D9B24C' : t.primary}>{u.tier}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'register' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', color: t.primary, marginBottom: 12 }}>
              Register New Member
            </h3>
            {added && (
              <div style={{ background: '#4CAF5022', border: '1px solid #4CAF50', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#4CAF50', fontSize: 13 }}>
                ✓ Member registered successfully under code {dealer.code}!
              </div>
            )}
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Input label="Full Name" value={form.name} onChange={v => set('name', v)} />
                <Input label="Email" type="email" value={form.email} onChange={v => set('email', v)} />
                <Input label="Phone" value={form.phone} onChange={v => set('phone', v)} />
                <Input label="Gender" value={form.gender} onChange={v => set('gender', v)} options={['Male', 'Female']} />
                <Input label="Date of Birth" type="date" value={form.dob} onChange={v => set('dob', v)} />
                <Input label="City" value={form.city} onChange={v => set('city', v)} options={CITIES} />
                <Input label="Education" value={form.education} onChange={v => set('education', v)} />
                <Input label="Occupation" value={form.occupation} onChange={v => set('occupation', v)} />
                <Input label="Nakshatra" value={form.nakshatra} onChange={v => set('nakshatra', v)} options={NAKSHATRAS} />
                <Input label="Rashi" value={form.rashi} onChange={v => set('rashi', v)} options={RASHIS} />
                <Input label="Tier" value={form.tier} onChange={v => set('tier', v)} options={['standard', 'elite']} />
                <Input label="Plan" value={form.plan} onChange={v => set('plan', v)}
                  options={PLANS[form.tier].map(p => p.id)} />
              </div>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.muted, marginBottom: 12 }}>
                PROMO CODE: <strong style={{ color: t.gold }}>{dealer.code}</strong> — auto-attached
              </p>
              <Btn variant="primary" onClick={registerMember}>Register Member</Btn>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

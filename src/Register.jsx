import React, { useState } from 'react'
import { STD, PLANS, NAKSHATRAS, RASHIS, CITIES, state } from './data.js'
import { Divider, Btn, Card, Input, Label } from './components.jsx'

const STEPS = ['Personal', 'Family', 'Education & Work', 'Horoscope', 'Hobbies & Partner', 'Assets', 'Package', 'Payment']

const blank = {
  name: '', email: '', phone: '', gender: 'Male', dob: '', religion: 'Hindu', caste: 'Iyer',
  city: '', education: '', occupation: '', income: '', tier: 'standard', plan: 'gold',
  nakshatra: '', rashi: '', birthTime: '', birthPlace: '',
  assets: { property: '', vehicle: '', savings: '' },
  hobbies: '', partnerExpectation: '', siblings: [], dealerCode: '',
  fee_status: 'pending', approved: false, photo: null, chartPhoto: null,
  interests: [], coupons: [],
}

export default function Register({ setPage, onLogin }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ ...blank })
  const [paying, setPaying] = useState(false)
  const [done, setDone] = useState(false)
  const t = STD

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setAsset = (k, v) => setForm(f => ({ ...f, assets: { ...f.assets, [k]: v } }))

  const addSibling = () => setForm(f => ({ ...f, siblings: [...f.siblings, { name: '', gender: 'Male', status: 'Unmarried' }] }))
  const setSibling = (i, k, v) => setForm(f => {
    const s = [...f.siblings]; s[i] = { ...s[i], [k]: v }; return { ...f, siblings: s }
  })
  const removeSibling = (i) => setForm(f => ({ ...f, siblings: f.siblings.filter((_, j) => j !== i) }))

  const handlePayment = () => {
    setPaying(true)
    setTimeout(() => {
      const newUser = {
        ...form,
        id: 'u' + Date.now(),
        hobbies: form.hobbies.split(',').map(h => h.trim()).filter(Boolean),
        fee_status: 'paid',
      }
      // validate dealer code
      const dealer = state.dealers.find(d => d.code === form.dealerCode)
      if (dealer) dealer.members.push(newUser.id)
      state.users.push(newUser)
      setPaying(false)
      setDone(true)
    }, 1800)
  }

  if (done) {
    const user = state.users[state.users.length - 1]
    return (
      <div style={{ background: t.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <Card tier="standard" style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', color: t.primary, marginBottom: 8 }}>Registration Complete!</h2>
          <Divider />
          <p style={{ color: t.muted, marginBottom: 16, fontSize: 14 }}>
            Your profile is under review. You'll be notified once approved by our team.
          </p>
          <Btn onClick={() => { onLogin(user); setPage('dashboard') }}>Go to Dashboard</Btn>
        </Card>
      </div>
    )
  }

  const selectedPlan = [...PLANS.standard, ...PLANS.elite].find(p => p.id === form.plan)

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: '2rem', color: t.text }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', color: t.primary, textAlign: 'center', marginBottom: 4 }}>
          Create Your Profile
        </h2>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 12,
              background: i === step ? t.primary : i < step ? t.gold + '44' : t.border,
              color: i === step ? '#fff' : i < step ? t.gold : t.muted,
            }}>{s}</div>
          ))}
        </div>

        <Card tier="standard">
          {/* Step 0: Personal */}
          {step === 0 && (
            <div>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 16 }}>Personal Details</h3>
              <Input label="Full Name" value={form.name} onChange={v => set('name', v)} />
              <Input label="Email" type="email" value={form.email} onChange={v => set('email', v)} />
              <Input label="Phone" value={form.phone} onChange={v => set('phone', v)} />
              <Input label="Gender" value={form.gender} onChange={v => set('gender', v)} options={['Male', 'Female']} />
              <Input label="Date of Birth" type="date" value={form.dob} onChange={v => set('dob', v)} />
              <Input label="Religion" value={form.religion} onChange={v => set('religion', v)} />
              <Input label="Caste / Sub-caste" value={form.caste} onChange={v => set('caste', v)} />
              <Input label="City" value={form.city} onChange={v => set('city', v)} options={CITIES} />
              <Input label="Dealer Referral Code (optional)" value={form.dealerCode} onChange={v => set('dealerCode', v)} />
            </div>
          )}

          {/* Step 1: Family & Siblings */}
          {step === 1 && (
            <div>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 16 }}>Family & Siblings</h3>
              <div style={{ marginBottom: 16 }}>
                <Label>Siblings</Label>
                {form.siblings.map((sib, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 8, flexWrap: 'wrap' }}>
                    <div style={{ flex: 2 }}>
                      <Input label="Name" value={sib.name} onChange={v => setSibling(i, 'name', v)} style={{ marginBottom: 0 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input label="Gender" value={sib.gender} onChange={v => setSibling(i, 'gender', v)} options={['Male', 'Female']} style={{ marginBottom: 0 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input label="Status" value={sib.status} onChange={v => setSibling(i, 'status', v)} options={['Married', 'Unmarried']} style={{ marginBottom: 0 }} />
                    </div>
                    <Btn variant="ghost" onClick={() => removeSibling(i)} style={{ padding: '8px 10px', marginBottom: 14 }}>✕</Btn>
                  </div>
                ))}
                <Btn variant="outline" onClick={addSibling} style={{ marginTop: 8 }}>+ Add Sibling</Btn>
              </div>
            </div>
          )}

          {/* Step 2: Education & Work */}
          {step === 2 && (
            <div>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 16 }}>Education & Work</h3>
              <Input label="Highest Education" value={form.education} onChange={v => set('education', v)}
                options={['High School', 'Diploma', 'B.A/B.Sc/B.Com', 'B.Tech/B.E', 'MBA', 'M.Tech', 'CA', 'MBBS', 'MD/MS', 'PhD', 'Other']} />
              <Input label="Occupation" value={form.occupation} onChange={v => set('occupation', v)} />
              <Input label="Annual Income (₹)" value={form.income} onChange={v => set('income', v)} />
            </div>
          )}

          {/* Step 3: Horoscope */}
          {step === 3 && (
            <div>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 16 }}>Horoscope Details</h3>
              <Input label="Birth Time" type="time" value={form.birthTime} onChange={v => set('birthTime', v)} />
              <Input label="Birth Place" value={form.birthPlace} onChange={v => set('birthPlace', v)} />
              <Input label="Nakshatra" value={form.nakshatra} onChange={v => set('nakshatra', v)} options={NAKSHATRAS} />
              <Input label="Rashi" value={form.rashi} onChange={v => set('rashi', v)} options={RASHIS} />
              <div style={{ marginTop: 8 }}>
                <Label>Horoscope Chart (upload)</Label>
                <input type="file" accept="image/*,.pdf" style={{ marginTop: 6, fontSize: 13, color: t.muted }} />
                <p style={{ fontSize: 11, color: t.muted, marginTop: 4, fontStyle: 'italic' }}>
                  ⚠ Chart upload is simulated in this demo.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Hobbies & Partner */}
          {step === 4 && (
            <div>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 16 }}>Hobbies & Partner Expectations</h3>
              <Input label="Hobbies (comma-separated)" value={form.hobbies} onChange={v => set('hobbies', v)} />
              <div style={{ marginBottom: 14 }}>
                <Label>Partner Expectations</Label>
                <textarea
                  value={form.partnerExpectation}
                  onChange={e => set('partnerExpectation', e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', marginTop: 4, padding: '9px 12px', borderRadius: 6,
                    fontFamily: 'Inter', fontSize: 14, background: '#fff', color: t.text,
                    border: `1px solid ${t.border}`, outline: 'none', resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 5: Assets */}
          {step === 5 && (
            <div>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 16 }}>Assets (₹)</h3>
              <Input label="Property Value (₹)" value={form.assets.property} onChange={v => setAsset('property', v)} />
              <Input label="Vehicle Value (₹)" value={form.assets.vehicle} onChange={v => setAsset('vehicle', v)} />
              <Input label="Savings / Investments (₹)" value={form.assets.savings} onChange={v => setAsset('savings', v)} />
            </div>
          )}

          {/* Step 6: Package */}
          {step === 6 && (
            <div>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 16 }}>Choose Your Plan</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['standard', 'elite'].map(tier => (
                  <button key={tier} onClick={() => set('tier', tier)} style={{
                    fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '6px 16px', borderRadius: 20, border: `1.5px solid ${tier === 'elite' ? '#D9B24C' : t.primary}`, cursor: 'pointer',
                    background: form.tier === tier ? (tier === 'elite' ? '#D9B24C' : t.primary) : 'transparent',
                    color: form.tier === tier ? '#fff' : (tier === 'elite' ? '#D9B24C' : t.primary),
                  }}>{tier}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {PLANS[form.tier].map(plan => (
                  <div key={plan.id} onClick={() => set('plan', plan.id)} style={{
                    flex: 1, minWidth: 160, padding: '1rem', borderRadius: 8, cursor: 'pointer',
                    border: form.plan === plan.id ? `2px solid ${t.gold}` : `1px solid ${t.border}`,
                    background: form.plan === plan.id ? t.gold + '11' : t.panel,
                  }}>
                    <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.gold, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{plan.name}</p>
                    <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.6rem', fontWeight: 700, color: t.primary }}>₹{plan.price}</p>
                    <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: t.muted }}>/month</p>
                    <ul style={{ listStyle: 'none', marginTop: 8 }}>
                      {plan.features.map(f => <li key={f} style={{ fontSize: 12, color: t.muted, padding: '2px 0' }}>✦ {f}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Payment */}
          {step === 7 && (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 16 }}>Payment</h3>
              <div style={{ background: t.bg, borderRadius: 8, padding: '1.5rem', marginBottom: 20, border: `1px solid ${t.border}` }}>
                <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Order Summary</p>
                <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginTop: 8 }}>
                  {selectedPlan?.name} Plan — ₹{selectedPlan?.price}/month
                </p>
                <p style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Tier: {form.tier.charAt(0).toUpperCase() + form.tier.slice(1)}</p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <Input label="Card Number" value="4242 4242 4242 4242" onChange={() => {}} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <Input label="Expiry" value="12/27" onChange={() => {}} style={{ flex: 1 }} />
                  <Input label="CVV" value="123" onChange={() => {}} style={{ flex: 1 }} />
                </div>
              </div>
              <Btn variant="gold" onClick={handlePayment} disabled={paying} style={{ width: '100%', padding: '12px' }}>
                {paying ? 'Processing…' : `Pay ₹${selectedPlan?.price}`}
              </Btn>
              <p style={{ fontSize: 11, color: t.muted, marginTop: 8, fontStyle: 'italic' }}>
                🔒 Simulated payment — no real charge in this demo.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Btn variant="ghost" onClick={() => step === 0 ? setPage('landing') : setStep(s => s - 1)}>
              {step === 0 ? 'Cancel' : '← Back'}
            </Btn>
            {step < STEPS.length - 1 && (
              <Btn variant="primary" onClick={() => setStep(s => s + 1)}>
                Next →
              </Btn>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

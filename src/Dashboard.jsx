import React, { useState } from 'react'
import { STD, ELITE, CITIES, VENDOR_CATS, SHARED_CATS, state } from './data.js'
import { tk, Divider, Btn, Card, Badge, Input, Label, PoruthamsGauge } from './components.jsx'

// Porutham computation (simplified traditional rules)
function computePorutham(u1, u2) {
  if (!u1.nakshatra || !u2.nakshatra) return { score: 0, details: [] }
  const n1 = u1.nakshatra, n2 = u2.nakshatra
  const r1 = u1.rashi, r2 = u2.rashi
  const checks = [
    { name: 'Dina', pass: n1 !== n2 },
    { name: 'Gana', pass: true }, // simplified
    { name: 'Mahendra', pass: n1 !== n2 },
    { name: 'Stree Deergha', pass: r1 !== r2 },
    { name: 'Yoni', pass: n1[0] !== n2[0] },
    { name: 'Rashi', pass: r1 !== r2 },
    { name: 'Rasyadhipati', pass: true },
    { name: 'Vasya', pass: r1 !== r2 },
    { name: 'Rajju', pass: n1 !== n2 },
    { name: 'Vedha', pass: n1 !== n2 },
  ]
  const score = checks.filter(c => c.pass).length
  return { score, details: checks }
}

function ProfileCard({ user, tier, onInterest, hasInterest }) {
  const t = tk(tier)
  return (
    <Card tier={tier} style={{ width: 240, position: 'relative' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: t.border,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, margin: '0 auto 12px', border: `2px solid ${t.gold}`,
      }}>
        {user.gender === 'Female' ? '👩' : '👨'}
      </div>
      <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.1rem', fontWeight: 600, color: t.primary, textAlign: 'center' }}>{user.name}</p>
      <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: t.gold, textAlign: 'center', letterSpacing: '0.08em', margin: '4px 0 8px', textTransform: 'uppercase' }}>
        {user.city} · {user.plan}
      </p>
      <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.8 }}>
        <div>🎓 {user.education}</div>
        <div>💼 {user.occupation}</div>
        <div>⭐ {user.nakshatra} · {user.rashi}</div>
        <div>💰 ₹{user.income}/yr</div>
      </div>
      <Btn tier={tier} variant={hasInterest ? 'ghost' : 'gold'} onClick={() => onInterest(user)}
        style={{ width: '100%', marginTop: 12, padding: '8px' }}>
        {hasInterest ? '✓ Interest Sent' : 'Send Interest'}
      </Btn>
    </Card>
  )
}

function VendorSection({ tier, city }) {
  const t = tk(tier)
  const [selCity, setSelCity] = useState(city || CITIES[0])
  const [selCat, setSelCat] = useState('All')

  const cats = tier === 'elite'
    ? ['All', ...VENDOR_CATS, ...SHARED_CATS]
    : ['All', ...VENDOR_CATS, ...SHARED_CATS]

  const vendors = state.vendors.filter(v =>
    v.city === selCity &&
    (selCat === 'All' || v.category === selCat) &&
    (v.tier === tier || v.tier === 'shared')
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <Input label="City" value={selCity} onChange={setSelCity} options={CITIES} tier={tier} />
        </div>
        <div style={{ flex: 2, minWidth: 180 }}>
          <Input label="Category" value={selCat} onChange={setSelCat} options={cats} tier={tier} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {vendors.map(v => (
          <Card key={v.id} tier={tier} style={{ width: 220 }}>
            <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1rem', fontWeight: 600, color: t.primary }}>{v.name}</p>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: t.gold, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '4px 0' }}>{v.category}</p>
            <p style={{ fontSize: 12, color: t.muted }}>📞 {v.contact}</p>
            <p style={{ fontSize: 12, color: t.muted }}>💰 {v.price}</p>
            <p style={{ fontSize: 12, color: t.muted }}>⭐ {v.rating}/5</p>
            {v.tier === 'shared' && <Badge color={t.gold} style={{ marginTop: 6 }}>Shared</Badge>}
          </Card>
        ))}
        {vendors.length === 0 && <p style={{ color: t.muted, fontStyle: 'italic' }}>No vendors found for this selection.</p>}
      </div>
    </div>
  )
}

export default function Dashboard({ user, refresh }) {
  const tier = user.tier
  const t = tk(tier)
  const [tab, setTab] = useState('browse')
  const [filters, setFilters] = useState({ gender: '', city: '', minAge: '', maxAge: '', nakshatra: '' })
  const [matchUser, setMatchUser] = useState(null)
  const [, forceUpdate] = useState(0)
  const re = () => { forceUpdate(n => n + 1); refresh() }

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const now = new Date()
  const getAge = (dob) => dob ? Math.floor((now - new Date(dob)) / (365.25 * 24 * 3600 * 1000)) : 0

  const browse = state.users.filter(u => {
    if (u.id === user.id) return false
    if (!u.approved) return false
    if (filters.gender && u.gender !== filters.gender) return false
    if (filters.city && u.city !== filters.city) return false
    const age = getAge(u.dob)
    if (filters.minAge && age < parseInt(filters.minAge)) return false
    if (filters.maxAge && age > parseInt(filters.maxAge)) return false
    if (filters.nakshatra && u.nakshatra !== filters.nakshatra) return false
    return true
  })

  const sendInterest = (target) => {
    if (!user.interests.includes(target.id)) {
      user.interests.push(target.id)
      // Check mutual interest → unlock coupon
      if (target.interests && target.interests.includes(user.id)) {
        const coupon = `MATCH-${user.id.slice(-4)}-${target.id.slice(-4)}`
        if (!user.coupons.includes(coupon)) user.coupons.push(coupon)
        if (!target.coupons.includes(coupon)) target.coupons.push(coupon)
      }
      re()
    }
  }

  const matchResult = matchUser ? computePorutham(user, matchUser) : null

  const tabs = ['browse', 'match', 'vendors', 'stories', 'coupons', 'profile']

  const isApproved = user.approved
  const isPending = !user.approved && user.fee_status === 'paid'
  const isUnpaid = user.fee_status !== 'paid'

  return (
    <div style={{ background: t.bg, minHeight: '100vh', color: t.text }}>
      {/* Dashboard header */}
      <div style={{
        background: tier === 'elite'
          ? 'linear-gradient(135deg, #17130F 0%, #0B0A09 100%)'
          : 'linear-gradient(135deg, #F3ECDF 0%, #FBF7F0 100%)',
        padding: '2rem', borderBottom: `1px solid ${t.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: t.border,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, border: `3px solid ${t.gold}`,
          }}>
            {user.gender === 'Female' ? '👩' : '👨'}
          </div>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', fontWeight: 700, color: t.primary }}>{user.name}</h2>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.gold, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {user.plan} · {user.tier} · {user.city}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isApproved && <Badge color="#4CAF50">Profile Active</Badge>}
            {isPending && <Badge color={t.gold}>Pending Approval</Badge>}
            {isUnpaid && <Badge color="#E53935">Payment Pending</Badge>}
            <Badge color={tier === 'elite' ? '#D9B24C' : t.primary}>{tier.toUpperCase()}</Badge>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem' }}>
        {/* Status banners */}
        {isPending && (
          <div style={{ background: t.gold + '22', border: `1px solid ${t.gold}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: t.text }}>
            ⏳ Your profile is under review by our team. You'll be notified once approved.
          </div>
        )}
        {isUnpaid && (
          <div style={{ background: '#E5393522', border: '1px solid #E53935', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: t.text }}>
            ⚠ Payment pending. Please complete payment to activate your profile.
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${t.border}`, paddingBottom: 8, flexWrap: 'wrap' }}>
          {tabs.map(tb => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: tab === tb ? t.primary : 'transparent',
              color: tab === tb ? '#fff' : t.muted,
            }}>{tb}</button>
          ))}
        </div>

        {/* Browse */}
        {tab === 'browse' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 12 }}>Browse Profiles</h3>
            {/* Filters */}
            <Card tier={tier} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <Input label="Gender" value={filters.gender} onChange={v => setF('gender', v)} options={['Male', 'Female']} tier={tier} />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <Input label="City" value={filters.city} onChange={v => setF('city', v)} options={CITIES} tier={tier} />
                </div>
                <div style={{ flex: 1, minWidth: 80 }}>
                  <Input label="Min Age" type="number" value={filters.minAge} onChange={v => setF('minAge', v)} tier={tier} />
                </div>
                <div style={{ flex: 1, minWidth: 80 }}>
                  <Input label="Max Age" type="number" value={filters.maxAge} onChange={v => setF('maxAge', v)} tier={tier} />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <Input label="Nakshatra" value={filters.nakshatra} onChange={v => setF('nakshatra', v)} tier={tier} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 14 }}>
                  <Btn tier={tier} variant="ghost" onClick={() => setFilters({ gender: '', city: '', minAge: '', maxAge: '', nakshatra: '' })}>
                    Clear
                  </Btn>
                </div>
              </div>
            </Card>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.muted, letterSpacing: '0.08em', marginBottom: 12 }}>
              {browse.length} PROFILES FOUND
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {browse.map(u => (
                <ProfileCard key={u.id} user={u} tier={tier}
                  onInterest={sendInterest}
                  hasInterest={user.interests.includes(u.id)} />
              ))}
              {browse.length === 0 && <p style={{ color: t.muted, fontStyle: 'italic' }}>No profiles match your filters.</p>}
            </div>
          </div>
        )}

        {/* Horoscope Match */}
        {tab === 'match' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 4 }}>Horoscope Match Calculator</h3>
            <p style={{ fontSize: 13, color: t.muted, marginBottom: 16, fontStyle: 'italic' }}>
              ⚠ AI-assisted porutham estimate. Always consult a qualified jyotishi for binding decisions.
            </p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Card tier={tier} style={{ flex: 1, minWidth: 260 }}>
                <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Your Profile</p>
                <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.1rem', color: t.primary }}>{user.name}</p>
                <p style={{ fontSize: 13, color: t.muted }}>Nakshatra: {user.nakshatra || '—'}</p>
                <p style={{ fontSize: 13, color: t.muted }}>Rashi: {user.rashi || '—'}</p>
              </Card>
              <Card tier={tier} style={{ flex: 1, minWidth: 260 }}>
                <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Match With</p>
                <Input label="Select Profile" value={matchUser?.id || ''} onChange={v => setMatchUser(state.users.find(u => u.id === v) || null)}
                  options={state.users.filter(u => u.id !== user.id && u.approved).map(u => u.id)} tier={tier} />
                {matchUser && (
                  <>
                    <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.1rem', color: t.primary }}>{matchUser.name}</p>
                    <p style={{ fontSize: 13, color: t.muted }}>Nakshatra: {matchUser.nakshatra || '—'}</p>
                    <p style={{ fontSize: 13, color: t.muted }}>Rashi: {matchUser.rashi || '—'}</p>
                  </>
                )}
              </Card>
            </div>
            {matchResult && matchUser && (
              <Card tier={tier} style={{ marginTop: 20, textAlign: 'center' }}>
                <PoruthamsGauge score={matchResult.score} tier={tier} />
                <Divider tier={tier} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                  {matchResult.details.map(d => (
                    <Badge key={d.name} color={d.pass ? '#4CAF50' : '#E53935'}>{d.name}: {d.pass ? '✓' : '✗'}</Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Vendors */}
        {tab === 'vendors' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 4 }}>Wedding Services</h3>
            <p style={{ fontSize: 13, color: t.muted, marginBottom: 16 }}>
              {tier === 'elite' ? 'Curated premium vendors for Elite members' : 'Trusted vendors across Tamil Nadu'}
            </p>
            <VendorSection tier={tier} city={user.city} />
          </div>
        )}

        {/* Success Stories */}
        {tab === 'stories' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 12 }}>Success Stories</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {state.successStories.map(s => (
                <Card key={s.id} tier={tier} style={{ width: 280 }}>
                  <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.1rem', fontWeight: 600, color: t.primary }}>{s.names}</p>
                  <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: t.gold, letterSpacing: '0.08em', margin: '4px 0 8px', textTransform: 'uppercase' }}>
                    {s.city} · {s.year} · {s.tier}
                  </p>
                  <p style={{ fontSize: 13, color: t.muted, fontStyle: 'italic' }}>"{s.story}"</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Gift Coupons */}
        {tab === 'coupons' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 4 }}>Gift Coupons</h3>
            <p style={{ fontSize: 13, color: t.muted, marginBottom: 16 }}>
              Coupons are unlocked when both parties express mutual interest.
            </p>
            {user.coupons.length === 0 ? (
              <Card tier={tier} style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🎁</p>
                <p style={{ color: t.muted, fontStyle: 'italic' }}>No coupons yet. Send interest to profiles and wait for mutual matches!</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {user.coupons.map(c => (
                  <Card key={c} tier={tier} style={{ textAlign: 'center', width: 200 }}>
                    <p style={{ fontSize: 28, marginBottom: 8 }}>🎁</p>
                    <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: t.gold, letterSpacing: '0.1em' }}>{c}</p>
                    <p style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Mutual Match Coupon</p>
                    <p style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>Valid on wedding services</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile */}
        {tab === 'profile' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: t.primary, marginBottom: 16 }}>My Profile</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Card tier={tier} style={{ flex: 1, minWidth: 260 }}>
                <Label tier={tier}>Personal</Label>
                <Divider tier={tier} />
                {[['Name', user.name], ['Email', user.email], ['Phone', user.phone], ['Gender', user.gender],
                  ['DOB', user.dob], ['City', user.city], ['Caste', user.caste]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
                    <span style={{ color: t.muted }}>{k}</span>
                    <span style={{ color: t.text, fontWeight: 500 }}>{v || '—'}</span>
                  </div>
                ))}
              </Card>
              <Card tier={tier} style={{ flex: 1, minWidth: 260 }}>
                <Label tier={tier}>Horoscope</Label>
                <Divider tier={tier} />
                {[['Nakshatra', user.nakshatra], ['Rashi', user.rashi], ['Birth Time', user.birthTime], ['Birth Place', user.birthPlace]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
                    <span style={{ color: t.muted }}>{k}</span>
                    <span style={{ color: t.text, fontWeight: 500 }}>{v || '—'}</span>
                  </div>
                ))}
              </Card>
              <Card tier={tier} style={{ flex: 1, minWidth: 260 }}>
                <Label tier={tier}>Assets & Work</Label>
                <Divider tier={tier} />
                {[['Education', user.education], ['Occupation', user.occupation], ['Income', user.income ? `₹${user.income}` : '—'],
                  ['Property', user.assets?.property ? `₹${user.assets.property}` : '—'],
                  ['Vehicle', user.assets?.vehicle ? `₹${user.assets.vehicle}` : '—'],
                  ['Savings', user.assets?.savings ? `₹${user.assets.savings}` : '—']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
                    <span style={{ color: t.muted }}>{k}</span>
                    <span style={{ color: t.text, fontWeight: 500 }}>{v || '—'}</span>
                  </div>
                ))}
              </Card>
            </div>
            {user.siblings?.length > 0 && (
              <Card tier={tier} style={{ marginTop: 16 }}>
                <Label tier={tier}>Siblings</Label>
                <Divider tier={tier} />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {user.siblings.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: t.text }}>
                      {s.name} ({s.gender}, {s.status})
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {user.hobbies?.length > 0 && (
              <Card tier={tier} style={{ marginTop: 16 }}>
                <Label tier={tier}>Hobbies</Label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {(Array.isArray(user.hobbies) ? user.hobbies : user.hobbies.split(',')).map(h => (
                    <Badge key={h} color={t.gold}>{h.trim()}</Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

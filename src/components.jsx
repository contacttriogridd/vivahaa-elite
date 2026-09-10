import React from 'react'
import { STD, ELITE } from './data.js'

export const tk = (tier) => tier === 'elite' ? ELITE : STD

// Ornamental lotus divider
export function Divider({ tier = 'standard' }) {
  const t = tk(tier)
  return (
    <div style={{ textAlign: 'center', margin: '1.5rem 0', color: t.gold, fontSize: '1.1rem', letterSpacing: '0.5rem', opacity: 0.7 }}>
      ❧ ✦ ❧
    </div>
  )
}

// Porutham score gauge
export function PoruthamsGauge({ score, total = 10, tier = 'standard' }) {
  const t = tk(tier)
  const pct = score / total
  const r = 54, cx = 64, cy = 64
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const color = pct >= 0.7 ? '#4CAF50' : pct >= 0.5 ? t.gold : '#E53935'
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.border} strokeWidth={10} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={t.text}
          style={{ fontFamily: 'Cormorant Garamond', fontSize: 26, fontWeight: 700 }}>{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={t.muted}
          style={{ fontFamily: 'IBM Plex Mono', fontSize: 10 }}>/ {total}</text>
      </svg>
      <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: t.muted, letterSpacing: '0.08em', marginTop: 4 }}>
        PORUTHAM SCORE
      </p>
      <p style={{ fontSize: 11, color: t.muted, marginTop: 6, fontStyle: 'italic', maxWidth: 220, margin: '6px auto 0' }}>
        ⚠ AI-assisted estimate. Consult a qualified jyotishi for binding decisions.
      </p>
    </div>
  )
}

// Button
export function Btn({ children, onClick, tier = 'standard', variant = 'primary', style: s = {}, disabled }) {
  const t = tk(tier)
  const base = {
    fontFamily: 'Inter', fontWeight: 600, fontSize: 14, border: 'none',
    borderRadius: 6, padding: '10px 22px', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.2s', opacity: disabled ? 0.5 : 1, ...s,
  }
  const styles = {
    primary: { background: t.primary, color: '#fff' },
    gold: { background: t.gold, color: tier === 'elite' ? '#0B0A09' : '#fff' },
    outline: { background: 'transparent', color: t.primary, border: `1.5px solid ${t.primary}` },
    ghost: { background: 'transparent', color: t.muted, border: `1px solid ${t.border}` },
  }
  return <button style={{ ...base, ...styles[variant] }} onClick={onClick} disabled={disabled}>{children}</button>
}

// Card
export function Card({ children, tier = 'standard', style: s = {} }) {
  const t = tk(tier)
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12,
      padding: '1.5rem', ...s,
    }}>{children}</div>
  )
}

// Input
export function Input({ label, value, onChange, type = 'text', tier = 'standard', options, style: s = {} }) {
  const t = tk(tier)
  const base = {
    width: '100%', padding: '9px 12px', borderRadius: 6, fontFamily: 'Inter', fontSize: 14,
    background: tier === 'elite' ? '#0B0A09' : '#fff', color: t.text,
    border: `1px solid ${t.border}`, outline: 'none', marginTop: 4, ...s,
  }
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</label>}
      {options
        ? <select value={value} onChange={e => onChange(e.target.value)} style={base}>
            <option value="">Select…</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={base} />
      }
    </div>
  )
}

// Label
export function Label({ children, tier = 'standard' }) {
  const t = tk(tier)
  return <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{children}</span>
}

// Badge
export function Badge({ children, color = '#C6982F', bg }) {
  return (
    <span style={{
      fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 4, background: bg || color + '22', color,
    }}>{children}</span>
  )
}

// Top nav bar
export function NavBar({ page, setPage, currentUser, currentDealer, isAdmin, onLogout }) {
  const tier = currentUser?.tier || 'standard'
  const t = tk(tier)
  const bg = tier === 'elite' ? ELITE.panel : STD.bg
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: bg, borderBottom: `1px solid ${t.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: 60,
    }}>
      <span
        onClick={() => setPage('landing')}
        style={{ fontFamily: 'Cormorant Garamond', fontSize: 22, fontWeight: 700, color: t.primary, cursor: 'pointer' }}>
        Vivahaa Elite
      </span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!currentUser && !currentDealer && !isAdmin && (
          <>
            <Btn tier="standard" variant="ghost" onClick={() => setPage('landing')} style={{ padding: '6px 14px' }}>Home</Btn>
            <Btn tier="standard" variant="primary" onClick={() => setPage('register')} style={{ padding: '6px 14px' }}>Register</Btn>
            <Btn tier="standard" variant="outline" onClick={() => setPage('login')} style={{ padding: '6px 14px' }}>Sign In</Btn>
          </>
        )}
        {currentUser && (
          <>
            <Btn tier={tier} variant="ghost" onClick={() => setPage('dashboard')} style={{ padding: '6px 14px' }}>Dashboard</Btn>
            <Btn tier={tier} variant="ghost" onClick={onLogout} style={{ padding: '6px 14px' }}>Sign Out</Btn>
          </>
        )}
        {currentDealer && (
          <>
            <Btn tier="standard" variant="ghost" onClick={() => setPage('dealer')} style={{ padding: '6px 14px' }}>Dealer Portal</Btn>
            <Btn tier="standard" variant="ghost" onClick={onLogout} style={{ padding: '6px 14px' }}>Sign Out</Btn>
          </>
        )}
        {isAdmin && (
          <>
            <Btn tier="standard" variant="ghost" onClick={() => setPage('admin')} style={{ padding: '6px 14px' }}>Admin</Btn>
            <Btn tier="standard" variant="ghost" onClick={onLogout} style={{ padding: '6px 14px' }}>Sign Out</Btn>
          </>
        )}
      </div>
    </nav>
  )
}

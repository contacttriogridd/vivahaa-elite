import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ADMIN } from '../data.js'

const A = ADMIN

// ── Animated counter ────────────────────────────────────────────────────────
export function AnimCounter({ value, prefix = '', suffix = '', duration = 1.2 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const end = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g,'')) || 0
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(end * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <>{prefix}{display.toLocaleString('en-IN')}{suffix}</>
}

// ── Stat card ───────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, sub, color = A.gold, trend, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: `0 20px 60px ${color}22` }}
      style={{
        background: A.gradientCard, border: `1px solid ${A.border}`,
        borderRadius: 16, padding: '1.4rem 1.6rem', position: 'relative', overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        borderRadius: '50%', background: color + '18', filter: 'blur(20px)',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: color + '18',
          border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{icon}</div>
        {trend !== undefined && (
          <span style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.06em',
            color: trend >= 0 ? A.green : A.red,
            background: (trend >= 0 ? A.green : A.red) + '18',
            padding: '3px 8px', borderRadius: 6,
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.9rem', fontWeight: 700, color: A.text, lineHeight: 1 }}>
        <AnimCounter value={typeof value === 'number' ? value : 0} />
        {typeof value === 'string' && value}
      </p>
      <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>{label}</p>
      {sub && <p style={{ fontSize: 12, color: A.subtle, marginTop: 4 }}>{sub}</p>}
    </motion.div>
  )
}

// ── Glass card ──────────────────────────────────────────────────────────────
export function GlassCard({ children, style: s = {}, glow, onClick, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={onClick ? { scale: 1.01 } : {}}
      onClick={onClick}
      style={{
        background: 'rgba(22,22,42,0.85)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${glow ? A.gold + '44' : A.border}`,
        borderRadius: 16,
        boxShadow: glow ? `0 0 40px ${A.gold}18` : '0 4px 24px rgba(0,0,0,0.4)',
        ...s,
      }}
    >{children}</motion.div>
  )
}

// ── Admin button ────────────────────────────────────────────────────────────
export function ABtn({ children, onClick, variant = 'primary', size = 'md', icon, disabled, style: s = {} }) {
  const sizes = { sm: { padding: '6px 14px', fontSize: 12 }, md: { padding: '9px 20px', fontSize: 13 }, lg: { padding: '12px 28px', fontSize: 14 } }
  const variants = {
    primary: { background: A.gold, color: '#0B0A09', border: 'none' },
    danger:  { background: A.red + '22', color: A.red, border: `1px solid ${A.red}44` },
    success: { background: A.green + '22', color: A.green, border: `1px solid ${A.green}44` },
    ghost:   { background: 'transparent', color: A.muted, border: `1px solid ${A.border}` },
    outline: { background: 'transparent', color: A.gold, border: `1px solid ${A.gold}66` },
    purple:  { background: A.purple + '22', color: A.purple, border: `1px solid ${A.purple}44` },
  }
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: 'Inter', fontWeight: 600, borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6, opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s', ...sizes[size], ...variants[variant], ...s,
      }}
    >
      {icon && <span>{icon}</span>}{children}
    </motion.button>
  )
}

// ── Badge ───────────────────────────────────────────────────────────────────
export function ABadge({ children, color = A.gold, dot }) {
  return (
    <span style={{
      fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: 20, background: color + '22', color,
      border: `1px solid ${color}44`, display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />}
      {children}
    </span>
  )
}

// ── Status badge ────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    active: { color: ADMIN.green, label: 'Active' },
    approved: { color: ADMIN.green, label: 'Approved' },
    pending: { color: ADMIN.orange, label: 'Pending' },
    suspended: { color: ADMIN.red, label: 'Suspended' },
    rejected: { color: ADMIN.red, label: 'Rejected' },
    paid: { color: ADMIN.green, label: 'Paid' },
    unpaid: { color: ADMIN.red, label: 'Unpaid' },
    verified: { color: ADMIN.cyan, label: 'Verified' },
    elite: { color: ADMIN.gold, label: 'Elite' },
    standard: { color: ADMIN.blue, label: 'Standard' },
  }
  const s = map[status?.toLowerCase()] || { color: ADMIN.muted, label: status }
  return <ABadge color={s.color} dot>{s.label}</ABadge>
}

// ── Input ───────────────────────────────────────────────────────────────────
export function AInput({ label, value, onChange, type = 'text', options, placeholder, style: s = {} }) {
  const base = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontFamily: 'Inter', fontSize: 13,
    background: A.panel, color: A.text, border: `1px solid ${A.border}`, outline: 'none',
    marginTop: 4, transition: 'border-color 0.2s', ...s,
  }
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</label>}
      {options
        ? <select value={value} onChange={e => onChange(e.target.value)} style={base}>
            <option value="">All</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      }
    </div>
  )
}

// ── Section header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', fontWeight: 700, color: A.text, marginBottom: 4 }}>{title}</h2>
        {sub && <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muted, letterSpacing: '0.08em' }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}

// ── Gold divider ────────────────────────────────────────────────────────────
export function GoldDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1.5rem 0' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${A.gold}44)` }} />
      <span style={{ color: A.gold, fontSize: '0.9rem', opacity: 0.6 }}>✦</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${A.gold}44, transparent)` }} />
    </div>
  )
}

// ── Table ───────────────────────────────────────────────────────────────────
export function ATable({ columns, rows, onRowClick }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${A.border}` }}>
            {columns.map(c => (
              <th key={c.key} style={{
                fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap',
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.id || i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: `1px solid ${A.border}22`,
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              whileHover={{ backgroundColor: A.border + '33' }}
            >
              {columns.map(c => (
                <td key={c.key} style={{ padding: '11px 14px', color: A.text, whiteSpace: 'nowrap' }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: A.muted, fontStyle: 'italic' }}>
          No records found
        </div>
      )}
    </div>
  )
}

// ── Modal ───────────────────────────────────────────────────────────────────
export function AModal({ open, onClose, title, children, width = 640 }) {
  if (!open) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: A.card, border: `1px solid ${A.borderGlow}`,
            borderRadius: 20, padding: '2rem', width: '100%', maxWidth: width,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 60px ${A.gold}11`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', fontWeight: 700, color: A.text }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: A.muted, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Tabs ────────────────────────────────────────────────────────────────────
export function ATabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${A.border}`, marginBottom: 24, flexWrap: 'wrap' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '10px 18px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
            background: active === tab.id ? A.gold + '18' : 'transparent',
            color: active === tab.id ? A.gold : A.muted,
            borderBottom: active === tab.id ? `2px solid ${A.gold}` : '2px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          {tab.icon && <span style={{ marginRight: 6 }}>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Search bar ──────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: A.muted, fontSize: 14 }}>🔍</span>
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10,
          background: A.panel, color: A.text, border: `1px solid ${A.border}`,
          fontFamily: 'Inter', fontSize: 13, outline: 'none',
        }}
      />
    </div>
  )
}

// ── Progress bar ────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = A.gold, height = 6, label }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.text }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div style={{ height, background: A.border, borderRadius: height }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', background: color, borderRadius: height }}
        />
      </div>
    </div>
  )
}

// ── Notification toast ──────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  const colors = { success: A.green, error: A.red, info: A.blue, warning: A.orange }
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      style={{
        position: 'fixed', top: 20, left: '50%', zIndex: 9999,
        background: A.card, border: `1px solid ${colors[type]}44`,
        borderRadius: 12, padding: '12px 20px', color: A.text, fontSize: 13,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${colors[type]}22`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <span style={{ color: colors[type] }}>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      {message}
    </motion.div>
  )
}

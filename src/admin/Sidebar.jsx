import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ADMIN } from '../data.js'
import { canAccessSection } from './rbac.js'

const A = ADMIN

const NAV = [
  { id: 'overview',  icon: '◈', label: 'Overview',       group: 'main' },
  { id: 'users',     icon: '◉', label: 'Users',           group: 'main' },
  { id: 'engagement', icon: '♥', label: 'Engagement',     group: 'main' },
  { id: 'post-match', icon: '⚭', label: 'Post-Match',     group: 'main' },
  { id: 'dealers',   icon: '◎', label: 'Dealers',         group: 'main' },
  { id: 'vendors',   icon: '◐', label: 'Vendors',         group: 'main' },
  { id: 'employees', icon: '⚙', label: 'Employees',       group: 'main' },
  { id: 'packages',  icon: '◆', label: 'Packages',        group: 'manage' },
  { id: 'gifts',     icon: '◇', label: 'Gifts',           group: 'manage' },
  { id: 'horoscope', icon: '☽', label: 'Horoscope',       group: 'manage' },
  { id: 'payments',  icon: '₹', label: 'Payments',        group: 'analytics' },
  { id: 'enquiries', icon: '✉', label: 'Enquiries',       group: 'analytics' },
  { id: 'reports',   icon: '◈', label: 'Reports',         group: 'analytics' },
  { id: 'audit',     icon: '◉', label: 'Audit Log',       group: 'analytics' },
  { id: 'settings',  icon: '◎', label: 'Settings',        group: 'system' },
]

const GROUPS = {
  main:      'Core',
  manage:    'Management',
  analytics: 'Analytics',
  system:    'System',
}

export default function Sidebar({ active, onChange, onLogout, collapsed, setCollapsed, role }) {
  const visibleNav = role ? NAV.filter(n => canAccessSection(role, n.id)) : NAV
  const groups = [...new Set(visibleNav.map(n => n.group))]

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      style={{
        height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 200,
        background: A.sidebar,
        borderRight: `1px solid ${A.border}`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: `4px 0 40px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '1.4rem 0' : '1.4rem 1.4rem',
        borderBottom: `1px solid ${A.border}`,
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 64,
      }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.15rem', fontWeight: 700, color: A.gold, lineHeight: 1.1 }}>
                Vivahaa Elite
              </p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.muted, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>
                Admin Portal
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'none', border: 'none', color: A.muted, cursor: 'pointer',
            fontSize: 16, padding: 4, borderRadius: 6, transition: 'color 0.2s',
            flexShrink: 0,
          }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0', scrollbarWidth: 'none' }}>
        {groups.map(group => (
          <div key={group}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.subtle,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    padding: '12px 20px 4px',
                  }}
                >
                  {GROUPS[group]}
                </motion.p>
              )}
            </AnimatePresence>
            {visibleNav.filter(n => n.group === group).map(item => (
              <NavItem
                key={item.id}
                item={item}
                active={active === item.id}
                collapsed={collapsed}
                onClick={() => onChange(item.id)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: collapsed ? '1rem 0' : '1rem 1rem', borderTop: `1px solid ${A.border}` }}>
        <motion.button
          whileHover={{ backgroundColor: A.red + '18' }}
          onClick={onLogout}
          style={{
            width: '100%', background: 'none', border: `1px solid ${A.border}`,
            borderRadius: 8, padding: collapsed ? '8px 0' : '8px 12px',
            color: A.muted, cursor: 'pointer', fontFamily: 'Inter', fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8, transition: 'all 0.2s',
          }}
        >
          <span>⎋</span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  )
}

function NavItem({ item, active, collapsed, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ backgroundColor: ADMIN.border + '66' }}
      style={{
        width: '100%', background: active ? ADMIN.gold + '14' : 'none',
        border: 'none', borderLeft: active ? `2px solid ${ADMIN.gold}` : '2px solid transparent',
        padding: collapsed ? '10px 0' : '10px 18px',
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10, cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 15, color: active ? ADMIN.gold : ADMIN.muted, flexShrink: 0 }}>{item.icon}</span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              fontFamily: 'Inter', fontSize: 13, fontWeight: active ? 600 : 400,
              color: active ? ADMIN.text : ADMIN.muted, whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

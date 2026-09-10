import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ADMIN } from '../data.js'
import Sidebar from './Sidebar.jsx'
import Overview from './Overview.jsx'
import Users from './Users.jsx'
import Dealers from './Dealers.jsx'
import Vendors from './Vendors.jsx'
import Packages from './Packages.jsx'
import Gifts from './Gifts.jsx'
import Horoscope from './Horoscope.jsx'
import Reports from './Reports.jsx'
import AuditLog from './AuditLog.jsx'
import Settings from './Settings.jsx'

const A = ADMIN

const PAGE_MAP = {
  overview:  Overview,
  users:     Users,
  dealers:   Dealers,
  vendors:   Vendors,
  packages:  Packages,
  gifts:     Gifts,
  horoscope: Horoscope,
  reports:   Reports,
  audit:     AuditLog,
  settings:  Settings,
}

export default function AdminPortal({ onLogout, refresh }) {
  const [active, setActive] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [, forceUpdate] = useState(0)
  const re = () => { forceUpdate(n => n + 1); refresh?.() }

  const PageComponent = PAGE_MAP[active] || Overview
  const sidebarWidth = collapsed ? 68 : 240

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: A.bg, color: A.text }}>
      {/* Sidebar */}
      <Sidebar
        active={active}
        onChange={setActive}
        onLogout={onLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main content */}
      <motion.main
        animate={{ marginLeft: sidebarWidth }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Top bar */}
        <div style={{
          height: 64, borderBottom: `1px solid ${A.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem', background: A.sidebar, position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Admin Portal
            </span>
            <span style={{ color: A.border }}>›</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.gold, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {active}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg, ${A.gold}44, ${A.primary}44)`,
              border: `1px solid ${A.gold}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>👤</div>
            <div>
              <p style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: A.text, lineHeight: 1.2 }}>Super Admin</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.muted, letterSpacing: '0.08em' }}>VIVAHAA ELITE</p>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <PageComponent refresh={re} onNavigate={setActive} />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  )
}

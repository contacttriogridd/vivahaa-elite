import React, { useState, useEffect } from 'react'
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
import Payments from './Payments.jsx'
import Engagement from './Engagement.jsx'
import PostMatch from './PostMatch.jsx'
import EnquiriesFunnel from './EnquiriesFunnel.jsx'
import Employees from './Employees.jsx'
import { canAccessSection, ROLE_LABELS } from './rbac.js'

const A = ADMIN

const PAGE_MAP = {
  overview:  Overview,
  users:     Users,
  engagement: Engagement,
  'post-match': PostMatch,
  payments:  Payments,
  enquiries: EnquiriesFunnel,
  dealers:   Dealers,
  vendors:   Vendors,
  employees: Employees,
  packages:  Packages,
  gifts:     Gifts,
  horoscope: Horoscope,
  reports:   Reports,
  audit:     AuditLog,
  settings:  Settings,
}

// Below this width the sidebar auto-collapses to its icon-only rail so the
// content area keeps enough room to be usable (measured live: a 240px fixed
// sidebar left only 135px of content on a 375px phone, before the deeper
// flexbox min-width issue below was even in play).
const MOBILE_BREAKPOINT = 768

export default function AdminPortal({ employee, onLogout, refresh }) {
  const [active, setActive] = useState('overview')
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT)
  const [, forceUpdate] = useState(0)
  const re = () => { forceUpdate(n => n + 1); refresh?.() }

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const role = employee?.role
  // Defense in depth: the nav already hides inaccessible sections (see Sidebar.jsx),
  // but this guards direct `active` state changes too, and every underlying
  // /api/admin/* call is independently role-checked server-side regardless of what
  // this component renders — see server/lib/rbac.js.
  const PageComponent = (role && !canAccessSection(role, active)) ? Overview : (PAGE_MAP[active] || Overview)
  const sidebarWidth = collapsed ? 68 : 240

  // On mobile, a manually-expanded sidebar (via the rail toggle) covers most of
  // the 240px-wide content area — auto-collapse it back after picking a section,
  // the same way a hamburger menu closes after a tap, instead of leaving it open
  // over the page.
  const handleNavChange = (id) => {
    setActive(id)
    if (typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT) setCollapsed(true)
  }

  return (
    <div className="admin-root" style={{ display: 'flex', minHeight: '100vh', background: A.bg, color: A.text }}>
      {/* Sidebar */}
      <Sidebar
        active={active}
        onChange={handleNavChange}
        onLogout={onLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        role={role}
      />

      {/* Main content */}
      <motion.main
        animate={{ marginLeft: sidebarWidth }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        // minWidth: 0 overrides the flex item's default min-width:auto, which
        // otherwise sizes to its content's min-content width (e.g. a wide
        // table) and pushes the whole page wider than the viewport — a classic
        // flexbox trap. Confirmed via browser measurement: without it, every
        // section (including pre-existing ones like Overview) overflowed
        // horizontally at mobile widths, sometimes by 3-4x the viewport.
        style={{ flex: 1, minWidth: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
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
              <p style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: A.text, lineHeight: 1.2 }}>{employee?.name || 'Employee'}</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.muted, letterSpacing: '0.08em' }}>{employee?.employeeCode || ''} · {ROLE_LABELS[role] || role || ''}</p>
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

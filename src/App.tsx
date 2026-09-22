import React, { useEffect, useState } from 'react'
import { state } from './data'
import { NavBar } from './components'
import Landing from './Landing'
import Register from './pages/register'
import { AdminLogin, DealerLogin } from './Login'
import AdminPortal from './admin/AdminPortal'
import Dealer from './Dealer'
import Dashboard from './pages/Dashboard.tsx'
import PremiumLogin from './pages/PremiumLogin.tsx'
import { useAuth } from './contexts/AuthContext'
import { adminApi, vendorApi } from './admin/apiClient.js'
import VendorLogin from './vendor/VendorLogin.jsx'
import VendorPortal from './vendor/VendorPortal.jsx'

export default function App() {
  const [page, setPage] = useState('landing')
  const [currentDealer, setCurrentDealer] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  // Real signed-in employee (RBAC role, employeeCode, etc.), sourced from
  // /api/admin/me — not the mock data.js state, same principle as `user` below.
  const [employee, setEmployee] = useState<any>(null)
  // Real signed-in vendor (own bookings/ratings only), sourced from /api/vendor/me —
  // same pattern as `employee` above, deliberately separate state and token.
  const [vendor, setVendor] = useState<any>(null)
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate((n: number) => n + 1)

  // Restores an employee session across a page refresh — without this, reloading
  // while on the admin panel would silently drop back to the login screen even
  // though the JWT (8h expiry) is still valid.
  useEffect(() => {
    const token = localStorage.getItem('employeeAccessToken')
    if (!token) return
    adminApi.get('/admin/me')
      .then(({ data }) => { setEmployee(data.employee); setIsAdmin(true) })
      .catch(() => localStorage.removeItem('employeeAccessToken'))
  }, [])

  // Same restore-on-refresh behavior for a signed-in vendor.
  useEffect(() => {
    const token = localStorage.getItem('vendorAccessToken')
    if (!token) return
    vendorApi.get('/vendor/me')
      .then(({ data }) => setVendor(data.vendor))
      .catch(() => localStorage.removeItem('vendorAccessToken'))
  }, [])

  // Real signed-in user, sourced from the actual database via AuthContext — not the
  // mock data.js state. This is what "live auth end-to-end" (Phase 3) means: the
  // dashboard and nav both reflect whoever the backend says is logged in, not a
  // locally-held object nothing else writes to.
  const { user, logout: authLogout } = useAuth()

  // PremiumLogin.tsx never navigates on success — it only sets AuthContext's user.
  // This is the single place that decides "where do we go once someone is signed
  // in," rather than duplicating that decision inside the login component itself.
  // Scoped to 'premium-login' only (not 'landing') — an earlier version also
  // redirected from landing, which raced against logout: setPage('landing') ran
  // synchronously while the async authLogout() was still clearing `user`, so this
  // effect fired on the stale truthy user and bounced straight back to dashboard.
  useEffect(() => {
    if (user && page === 'premium-login') setPage('dashboard')
  }, [user, page])

  const dealerLogin = (dealer: any) => { state.currentDealer = dealer; setCurrentDealer(dealer) }
  const adminLogin = (emp: any) => { state.isAdmin = true; setEmployee(emp); setIsAdmin(true) }
  const logout = async () => {
    // Awaited so `user` is already cleared before we navigate — see the note above.
    await authLogout()
    state.currentDealer = null; state.isAdmin = false
    setCurrentDealer(null); setIsAdmin(false); setPage('landing')
  }
  const adminLogout = async () => {
    try { await adminApi.post('/admin/logout') } catch { /* token may already be expired */ }
    localStorage.removeItem('employeeAccessToken')
    state.isAdmin = false
    setEmployee(null); setIsAdmin(false); setPage('landing')
  }

  if (isAdmin) {
    return <AdminPortal employee={employee} onLogout={adminLogout} refresh={refresh} />
  }

  if (vendor) {
    return <VendorPortal vendor={vendor} onLogout={() => { setVendor(null); setPage('landing') }} />
  }

  const renderPage = () => {
    switch (page) {
      case 'landing':      return <Landing setPage={setPage} />
      case 'register':     return <Register onSuccess={() => setPage('dashboard')} />
      case 'premium-login': return <PremiumLogin />
      case 'admin-login':  return <AdminLogin setPage={setPage} onAdminLogin={adminLogin} />
      case 'dealer-login': return <DealerLogin setPage={setPage} onDealerLogin={dealerLogin} />
      case 'vendor-login': return <VendorLogin onVendorLogin={setVendor} />
      case 'dealer':       return currentDealer ? <Dealer dealer={currentDealer} refresh={refresh} /> : <DealerLogin setPage={setPage} onDealerLogin={dealerLogin} />
      case 'dashboard':    return user ? <Dashboard /> : <PremiumLogin />
      default:             return <Landing setPage={setPage} />
    }
  }

  return (
    <>
      <NavBar page={page} setPage={setPage} currentUser={user} currentDealer={currentDealer} isAdmin={isAdmin} onLogout={logout} />
      {renderPage()}
    </>
  )
}

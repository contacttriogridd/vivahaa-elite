import React, { useState } from 'react'
import { state } from './data'
import { NavBar } from './components'
import Landing from './Landing'
import Register from './pages/register'
import { UserLogin, AdminLogin, DealerLogin } from './Login'
import AdminPortal from './admin/AdminPortal'
import Dealer from './Dealer'
import Dashboard from './Dashboard'
import PremiumLogin from './pages/PremiumLogin.tsx'

export default function App() {
  const [page, setPage] = useState('landing')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentDealer, setCurrentDealer] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate((n: number) => n + 1)

  const login = (user: any) => { state.currentUser = user; setCurrentUser(user) }
  const dealerLogin = (dealer: any) => { state.currentDealer = dealer; setCurrentDealer(dealer) }
  const adminLogin = () => { state.isAdmin = true; setIsAdmin(true) }
  const logout = () => {
    state.currentUser = null; state.currentDealer = null; state.isAdmin = false
    setCurrentUser(null); setCurrentDealer(null); setIsAdmin(false); setPage('landing')
  }

  if (isAdmin) {
    return <AdminPortal onLogout={logout} refresh={refresh} />
  }

  const renderPage = () => {
    switch (page) {
      case 'landing':      return <Landing setPage={setPage} />
      case 'register':     return <Register onSuccess={() => setPage('dashboard')} />
      case 'login':        return <UserLogin setPage={setPage} onLogin={login} />
      case 'premium-login': return <PremiumLogin />
      case 'admin-login':  return <AdminLogin setPage={setPage} onAdminLogin={adminLogin} />
      case 'dealer-login': return <DealerLogin setPage={setPage} onDealerLogin={dealerLogin} />
      case 'dealer':       return currentDealer ? <Dealer dealer={currentDealer} refresh={refresh} /> : <DealerLogin setPage={setPage} onDealerLogin={dealerLogin} />
      case 'dashboard':    return currentUser ? <Dashboard user={currentUser} refresh={refresh} /> : <UserLogin setPage={setPage} onLogin={login} />
      default:             return <Landing setPage={setPage} />
    }
  }

  return (
    <>
      <NavBar page={page} setPage={setPage} currentUser={currentUser} currentDealer={currentDealer} isAdmin={isAdmin} onLogout={logout} />
      {renderPage()}
    </>
  )
}

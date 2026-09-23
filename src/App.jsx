import React, { useState } from 'react'
import { state } from './data.js'
import { NavBar } from './components.jsx'
import Landing from './Landing.jsx'
import Register from './Register.jsx'
import { AdminLogin, DealerLogin } from './Login.jsx'
import AdminPortal from './admin/AdminPortal.jsx'
import Dealer from './Dealer.jsx'
import Dashboard from './Dashboard.jsx'
import PremiumLogin from './pages/PremiumLogin.jsx'

export default function App() {
  const [page, setPage] = useState('landing')
  const [currentUser, setCurrentUser] = useState(null)
  const [currentDealer, setCurrentDealer] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate(n => n + 1)

  const login = (user) => { state.currentUser = user; setCurrentUser(user); setPage('dashboard') }
  const dealerLogin = (dealer) => { state.currentDealer = dealer; setCurrentDealer(dealer) }
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
      case 'register':     return <Register setPage={setPage} onLogin={login} />
      // Premium login is the primary user login
      case 'login':        return <PremiumLogin setPage={setPage} onLogin={login} />
      case 'admin-login':  return <AdminLogin setPage={setPage} onAdminLogin={adminLogin} />
      case 'dealer-login': return <DealerLogin setPage={setPage} onDealerLogin={dealerLogin} />
      case 'dealer':       return currentDealer ? <Dealer dealer={currentDealer} refresh={refresh} /> : <DealerLogin setPage={setPage} onDealerLogin={dealerLogin} />
      case 'dashboard':    return currentUser ? <Dashboard user={currentUser} refresh={refresh} /> : <PremiumLogin setPage={setPage} onLogin={login} />
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

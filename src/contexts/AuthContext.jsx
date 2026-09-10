import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import API from '../lib/api'

const AuthContext = createContext(null)

// Demo users — only active in development / demo mode
const DEMO_USERS = [
  { id: 'admin-demo', email: 'admin@vivahaaelite.demo', password: 'Admin@123', name: 'Admin', role: 'admin', tier: 'elite', plan: 'platinum', profileCompletion: 100, avatar: null },
  { id: 'user-demo',  email: 'demo@vivahaaelite.demo',  password: 'Demo@123',  name: 'Demo User', role: 'user', tier: 'elite', plan: 'gold', profileCompletion: 60, avatar: null },
]

const isDemoMode = () => import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    // Try real API first; fall back to demo token check
    API.get('/auth/profile')
      .then(res => setUser(res.data))
      .catch(() => {
        // Check if it's a demo token
        const demoUser = DEMO_USERS.find(u => `demo-token-${u.id}` === token)
        if (demoUser) {
          const { password: _p, ...safe } = demoUser
          setUser(safe)
        } else {
          localStorage.removeItem('accessToken')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password, rememberMe) => {
    // Demo mode shortcut
    if (isDemoMode()) {
      const demo = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
      if (demo) {
        const { password: _p, ...safe } = demo
        const token = `demo-token-${demo.id}`
        localStorage.setItem('accessToken', token)
        setUser(safe)
        return { accessToken: token, user: safe }
      }
    }
    // Real API
    const { data } = await API.post('/auth/login', { email, password, rememberMe })
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
    return data
  }, [])

  const loginWithGoogle = useCallback(() => {
    if (isDemoMode() && !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      // Simulate Google login in demo mode
      const demo = DEMO_USERS[1]
      const { password: _p, ...safe } = demo
      const token = `demo-token-${demo.id}`
      localStorage.setItem('accessToken', token)
      setUser(safe)
      return
    }
    window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`
  }, [])

  const logout = useCallback(async () => {
    try { await API.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  const register = useCallback(async (formData) => {
    const { data } = await API.post('/auth/register', formData)
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
    return data
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, register, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

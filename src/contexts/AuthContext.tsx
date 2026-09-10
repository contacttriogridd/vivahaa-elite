import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, AuthContextType } from '../types'
import API from '../lib/api'

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      API.get('/auth/profile')
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('accessToken'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    const { data } = await API.post('/auth/login', { email, password, rememberMe })
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
    return data
  }

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`
  }

  const logout = async () => {
    try { await API.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('accessToken')
    setUser(null)
  }

  const register = async (formData: Record<string, unknown>) => {
    const { data } = await API.post('/auth/register', formData)
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, register, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

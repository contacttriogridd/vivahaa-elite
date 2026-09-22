import React, { useState } from 'react'
import { STD, ELITE, state } from './data.js'
import { Divider, Btn, Card, Input } from './components.jsx'
import { adminApi } from './admin/apiClient.js'

function LoginShell({ tier = 'standard', title, children }) {
  const t = tier === 'elite' ? ELITE : STD
  return (
    <div style={{ background: t.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Card tier={tier} style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', color: t.primary, marginBottom: 4 }}>{title}</h2>
        <Divider tier={tier} />
        {children}
      </Card>
    </div>
  )
}

export function UserLogin({ setPage, onLogin }) {
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')

  const handle = () => {
    const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) { setErr('No account found. Please register first.'); return }
    onLogin(user)
    setPage('dashboard')
  }

  return (
    <LoginShell title="Welcome Back">
      <Input label="Email" type="email" value={email} onChange={setEmail} />
      <p style={{ fontSize: 11, color: STD.muted, marginBottom: 12, fontStyle: 'italic' }}>
        Demo: any registered email works (no password required)
      </p>
      {err && <p style={{ color: '#E53935', fontSize: 13, marginBottom: 12 }}>{err}</p>}
      <Btn variant="primary" onClick={handle} style={{ width: '100%' }}>Sign In</Btn>
      <p style={{ fontSize: 13, color: STD.muted, marginTop: 16 }}>
        New here?{' '}
        <span onClick={() => setPage('register')} style={{ color: STD.primary, cursor: 'pointer', textDecoration: 'underline' }}>
          Create a profile
        </span>
      </p>
    </LoginShell>
  )
}

export function AdminLogin({ setPage, onAdminLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setErr(''); setLoading(true)
    try {
      const { data } = await adminApi.post('/admin/login', { email, password: pass })
      localStorage.setItem('employeeAccessToken', data.accessToken)
      onAdminLogin(data.employee)
      setPage('admin')
    } catch (e) {
      setErr(e.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginShell title="Employee Sign-in">
      <Input label="Employee Email" type="email" value={email} onChange={setEmail} />
      <Input label="Password" type="password" value={pass} onChange={setPass} />
      <p style={{ fontSize: 11, color: STD.muted, marginBottom: 12, fontStyle: 'italic' }}>
        Demo: hr@vivahaaelite.demo / HrAdmin@123
      </p>
      {err && <p style={{ color: '#E53935', fontSize: 13, marginBottom: 12 }}>{err}</p>}
      <Btn variant="primary" onClick={handle} disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Signing in…' : 'Sign In'}
      </Btn>
    </LoginShell>
  )
}

export function DealerLogin({ setPage, onDealerLogin }) {
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')

  const handle = () => {
    const dealer = state.dealers.find(d => d.email.toLowerCase() === email.toLowerCase())
    if (!dealer) { setErr('No dealer account found.'); return }
    onDealerLogin(dealer)
    setPage('dealer')
  }

  return (
    <LoginShell title="Dealer Portal">
      <Input label="Dealer Email" type="email" value={email} onChange={setEmail} />
      <p style={{ fontSize: 11, color: STD.muted, marginBottom: 12, fontStyle: 'italic' }}>
        Demo: dealer@demo.com
      </p>
      {err && <p style={{ color: '#E53935', fontSize: 13, marginBottom: 12 }}>{err}</p>}
      <Btn variant="primary" onClick={handle} style={{ width: '100%' }}>Sign In</Btn>
    </LoginShell>
  )
}


import React, { useState } from 'react'
import { STD } from '../data.js'
import { Divider, Btn, Card, Input } from '../components.jsx'
import { vendorApi } from '../admin/apiClient.js'

export default function VendorLogin({ onVendorLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setErr(''); setLoading(true)
    try {
      const { data } = await vendorApi.post('/vendor/login', { email, password })
      localStorage.setItem('vendorAccessToken', data.accessToken)
      onVendorLogin(data.vendor)
    } catch (e) {
      setErr(e.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: STD.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Card tier="standard" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', color: STD.primary, marginBottom: 4 }}>Vendor Partner Portal</h2>
        <Divider tier="standard" />
        <Input label="Vendor Email" type="email" value={email} onChange={setEmail} />
        <Input label="Password" type="password" value={password} onChange={setPassword} />
        <p style={{ fontSize: 11, color: STD.muted, marginBottom: 12, fontStyle: 'italic' }}>
          Demo: vendor@vivahaaelite.demo / Vendor@123
        </p>
        {err && <p style={{ color: '#E53935', fontSize: 13, marginBottom: 12 }}>{err}</p>}
        <Btn variant="primary" onClick={handle} disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </Btn>
      </Card>
    </div>
  )
}

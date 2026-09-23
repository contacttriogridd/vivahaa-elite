import React, { useState } from 'react'
import { STD, PLANS, state } from './data.js'
import { Divider, Btn, Card, Badge, Label } from './components.jsx'

const t = STD

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: '1.2rem 1.5rem', textAlign: 'center', flex: 1, minWidth: 140 }}>
      <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', fontWeight: 700, color: color || t.primary }}>{value}</p>
      <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
    </div>
  )
}

function RevenueBar({ label, value, max, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: t.text }}>₹{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 8, background: t.border, borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function Admin({ setPage, refresh }) {
  const [tab, setTab] = useState('queue')
  const [, forceUpdate] = useState(0)
  const re = () => { forceUpdate(n => n + 1); refresh() }

  const pending = state.users.filter(u => !u.approved && u.fee_status === 'paid')
  const unpaid = state.users.filter(u => !u.approved && u.fee_status !== 'paid')
  const approved = state.users.filter(u => u.approved)

  const approve = (user) => {
    user.approved = true
    state.adminLog.push({ action: 'approve', userId: user.id, adminId: 'admin', ts: new Date().toISOString() })
    re()
  }
  const reject = (user) => {
    user.approved = false
    user.fee_status = 'rejected'
    state.adminLog.push({ action: 'reject', userId: user.id, adminId: 'admin', ts: new Date().toISOString() })
    re()
  }

  // Revenue calc
  const allPlans = [...PLANS.standard, ...PLANS.elite]
  const revenueByPlan = allPlans.map(p => ({
    ...p,
    count: state.users.filter(u => u.plan === p.id && u.fee_status === 'paid').length,
    revenue: state.users.filter(u => u.plan === p.id && u.fee_status === 'paid').length * p.price,
  }))
  const maxRev = Math.max(...revenueByPlan.map(p => p.revenue), 1)
  const totalRev = revenueByPlan.reduce((s, p) => s + p.revenue, 0)

  const tabs = ['queue', 'users', 'dealers', 'revenue', 'log']

  return (
    <div style={{ background: t.bg, minHeight: '100vh', color: t.text, padding: '2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', color: t.primary, marginBottom: 4 }}>Admin Console</h2>
        <Divider />

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatBox label="Total Users" value={state.users.length} />
          <StatBox label="Approved" value={approved.length} color="#4CAF50" />
          <StatBox label="Pending (paid)" value={pending.length} color={t.gold} />
          <StatBox label="Unpaid" value={unpaid.length} color="#E53935" />
          <StatBox label="Total Revenue" value={`₹${totalRev.toLocaleString()}`} color={t.primary} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${t.border}`, paddingBottom: 8 }}>
          {tabs.map(tb => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: tab === tb ? t.primary : 'transparent',
              color: tab === tb ? '#fff' : t.muted,
            }}>{tb}</button>
          ))}
        </div>

        {/* Approval Queue */}
        {tab === 'queue' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', color: t.primary, marginBottom: 12 }}>
              Pending Approvals — Fee Paid ({pending.length})
            </h3>
            {pending.length === 0 && <p style={{ color: t.muted, fontStyle: 'italic' }}>No pending approvals.</p>}
            {pending.map(u => (
              <Card key={u.id} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 600, color: t.text }}>{u.name}</p>
                  <p style={{ fontSize: 13, color: t.muted }}>{u.email} · {u.city} · {u.plan}</p>
                  <p style={{ fontSize: 12, color: t.muted }}>{u.nakshatra} · {u.rashi}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="primary" onClick={() => approve(u)} style={{ padding: '6px 16px' }}>Approve</Btn>
                  <Btn variant="ghost" onClick={() => reject(u)} style={{ padding: '6px 16px' }}>Reject</Btn>
                </div>
              </Card>
            ))}
            {unpaid.length > 0 && (
              <>
                <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', color: t.muted, margin: '20px 0 12px' }}>
                  Awaiting Payment ({unpaid.length})
                </h3>
                {unpaid.map(u => (
                  <Card key={u.id} style={{ marginBottom: 8, opacity: 0.6 }}>
                    <p style={{ fontWeight: 600, color: t.text }}>{u.name}</p>
                    <p style={{ fontSize: 13, color: t.muted }}>{u.email} · <Badge color="#E53935">Fee Pending</Badge></p>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* User Directory */}
        {tab === 'users' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', color: t.primary, marginBottom: 12 }}>
              All Users ({state.users.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${t.border}` }}>
                  {['Name', 'Email', 'City', 'Plan', 'Tier', 'Fee', 'Status'].map(h => (
                    <th key={h} style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: t.muted, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 10px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.users.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: '8px 10px', color: t.text, fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: '8px 10px', color: t.muted }}>{u.email}</td>
                    <td style={{ padding: '8px 10px', color: t.muted }}>{u.city}</td>
                    <td style={{ padding: '8px 10px' }}><Badge color={t.gold}>{u.plan}</Badge></td>
                    <td style={{ padding: '8px 10px' }}><Badge color={u.tier === 'elite' ? '#D9B24C' : t.primary}>{u.tier}</Badge></td>
                    <td style={{ padding: '8px 10px' }}><Badge color={u.fee_status === 'paid' ? '#4CAF50' : '#E53935'}>{u.fee_status}</Badge></td>
                    <td style={{ padding: '8px 10px' }}><Badge color={u.approved ? '#4CAF50' : '#E53935'}>{u.approved ? 'Approved' : 'Pending'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dealers */}
        {tab === 'dealers' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', color: t.primary, marginBottom: 12 }}>
              Dealers ({state.dealers.length})
            </h3>
            {state.dealers.map(d => (
              <Card key={d.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, color: t.text }}>{d.name}</p>
                    <p style={{ fontSize: 13, color: t.muted }}>{d.email} · {d.city}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge color={t.gold}>{d.code}</Badge>
                    <p style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{d.members.length} members referred</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Revenue */}
        {tab === 'revenue' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', color: t.primary, marginBottom: 16 }}>
              Revenue by Plan
            </h3>
            <Card style={{ marginBottom: 20 }}>
              {revenueByPlan.map(p => (
                <RevenueBar key={p.id} label={`${p.name} (${p.count})`} value={p.revenue} max={maxRev}
                  color={p.id.includes('platinum') ? '#D9B24C' : t.primary} />
              ))}
            </Card>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatBox label="Standard Revenue" value={`₹${revenueByPlan.filter(p => !p.id.includes('platinum')).reduce((s, p) => s + p.revenue, 0).toLocaleString()}`} />
              <StatBox label="Elite Revenue" value={`₹${revenueByPlan.filter(p => p.id.includes('platinum')).reduce((s, p) => s + p.revenue, 0).toLocaleString()}`} color="#D9B24C" />
              <StatBox label="Total" value={`₹${totalRev.toLocaleString()}`} color={t.primary} />
            </div>
          </div>
        )}

        {/* Audit Log */}
        {tab === 'log' && (
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', color: t.primary, marginBottom: 12 }}>
              Audit Log ({state.adminLog.length})
            </h3>
            {state.adminLog.length === 0 && <p style={{ color: t.muted, fontStyle: 'italic' }}>No actions yet.</p>}
            {[...state.adminLog].reverse().map((log, i) => (
              <div key={i} style={{ padding: '8px 12px', borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: t.gold, marginRight: 8, textTransform: 'uppercase' }}>{log.action}</span>
                <span style={{ color: t.text }}>User {log.userId}</span>
                <span style={{ color: t.muted, marginLeft: 8 }}>by {log.adminId}</span>
                <span style={{ color: t.muted, float: 'right', fontSize: 11 }}>{new Date(log.ts).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ADMIN, state } from '../data.js'
import { StatCard, GlassCard, GoldDivider, SectionHeader, ABadge, ProgressBar } from './ui.jsx'

const A = ADMIN

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: 12, color: p.color, marginBottom: 2 }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

export default function Overview({ onNavigate }) {
  const users = state.users
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'active').length
  const eliteUsers = users.filter(u => u.tier === 'elite').length
  const stdUsers = users.filter(u => u.tier === 'standard').length
  const pendingApproval = users.filter(u => !u.approved && u.fee_status === 'paid').length
  const suspended = users.filter(u => u.status === 'suspended').length
  const totalRevenue = state.monthlyRevenue.reduce((s, m) => s + m.total, 0)
  const thisMonth = state.monthlyRevenue[state.monthlyRevenue.length - 1]
  const lastMonth = state.monthlyRevenue[state.monthlyRevenue.length - 2]
  const revTrend = Math.round(((thisMonth.total - lastMonth.total) / lastMonth.total) * 100)
  const totalWeddings = state.successStories.length
  const topDealers = [...state.dealers].sort((a,b) => b.totalEarned - a.totalEarned).slice(0,3)

  // Gender distribution
  const maleCount = users.filter(u => u.gender === 'Male').length
  const femaleCount = users.filter(u => u.gender === 'Female').length

  // City distribution
  const cityData = ['Coimbatore','Salem','Erode','Tirupur','Namakkal','Dindigul'].map(city => ({
    city, count: users.filter(u => u.city === city).length,
  }))

  // Plan distribution
  const planData = [
    { name: 'Silver', value: users.filter(u=>u.plan==='silver').length, color: '#94A3B8' },
    { name: 'Gold', value: users.filter(u=>u.plan==='gold').length, color: A.gold },
    { name: 'Diamond', value: users.filter(u=>u.plan==='diamond').length, color: A.cyan },
    { name: 'Platinum', value: users.filter(u=>u.plan==='platinum').length, color: A.purple },
    { name: 'Plat+', value: users.filter(u=>u.plan==='platinumplus').length, color: A.orange },
  ]

  const recentActivity = state.adminLog.slice(0, 8)

  return (
    <div>
      <SectionHeader
        title="Command Center"
        sub={`${new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`}
      />

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon="◉" label="Total Members" value={totalUsers} trend={12} color={A.gold} delay={0} />
        <StatCard icon="✦" label="Active Members" value={activeUsers} trend={8} color={A.green} delay={0.05} />
        <StatCard icon="♛" label="Elite Members" value={eliteUsers} trend={15} color={A.purple} delay={0.1} />
        <StatCard icon="⏳" label="Pending Approval" value={pendingApproval} color={A.orange} delay={0.15} />
        <StatCard icon="⊘" label="Suspended" value={suspended} color={A.red} delay={0.2} />
        <StatCard icon="💍" label="Weddings Completed" value={totalWeddings} trend={22} color={A.cyan} delay={0.25} />
      </div>

      {/* Revenue KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon="₹" label="Total Revenue" value={`₹${(totalRevenue/100000).toFixed(1)}L`} trend={revTrend} color={A.gold} delay={0.3} />
        <StatCard icon="📅" label="This Month" value={`₹${(thisMonth.total/1000).toFixed(0)}K`} trend={revTrend} color={A.green} delay={0.35} />
        <StatCard icon="🏆" label="Elite Revenue" value={`₹${(state.monthlyRevenue.reduce((s,m)=>s+m.elite,0)/100000).toFixed(1)}L`} color={A.purple} delay={0.4} />
        <StatCard icon="🤝" label="Dealer Revenue" value={`₹${(state.monthlyRevenue.reduce((s,m)=>s+m.dealer,0)/1000).toFixed(0)}K`} color={A.orange} delay={0.45} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Revenue area chart */}
        <GlassCard style={{ padding: '1.5rem' }} delay={0.5}>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', fontWeight: 700, color: A.text, marginBottom: 4 }}>Revenue Overview</p>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', marginBottom: 16 }}>STANDARD VS ELITE · 12 MONTHS</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={state.monthlyRevenue}>
              <defs>
                <linearGradient id="gradElite" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={A.gold} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={A.gold} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradStd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={A.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={A.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={A.border} />
              <XAxis dataKey="month" tick={{ fill: A.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: A.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="elite" name="Elite" stroke={A.gold} fill="url(#gradElite)" strokeWidth={2} />
              <Area type="monotone" dataKey="standard" name="Standard" stroke={A.blue} fill="url(#gradStd)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Plan distribution pie */}
        <GlassCard style={{ padding: '1.5rem' }} delay={0.55}>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', fontWeight: 700, color: A.text, marginBottom: 4 }}>Plan Distribution</p>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted, letterSpacing: '0.08em', marginBottom: 8 }}>MEMBERS BY PLAN</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={planData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {planData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {planData.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: A.muted }}>{p.name} ({p.value})</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* City bar chart */}
        <GlassCard style={{ padding: '1.5rem' }} delay={0.6}>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.1rem', fontWeight: 700, color: A.text, marginBottom: 12 }}>City Distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={cityData} layout="vertical">
              <XAxis type="number" tick={{ fill: A.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="city" tick={{ fill: A.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill={A.gold} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Gender + tier */}
        <GlassCard style={{ padding: '1.5rem' }} delay={0.65}>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.1rem', fontWeight: 700, color: A.text, marginBottom: 16 }}>Demographics</p>
          <div style={{ marginBottom: 16 }}>
            <ProgressBar value={maleCount} max={totalUsers} color={A.blue} label={`Male (${maleCount})`} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <ProgressBar value={femaleCount} max={totalUsers} color={A.purple} label={`Female (${femaleCount})`} />
          </div>
          <GoldDivider />
          <div style={{ marginBottom: 12 }}>
            <ProgressBar value={stdUsers} max={totalUsers} color={A.blue} label={`Standard (${stdUsers})`} />
          </div>
          <div>
            <ProgressBar value={eliteUsers} max={totalUsers} color={A.gold} label={`Elite (${eliteUsers})`} />
          </div>
        </GlassCard>

        {/* Top dealers */}
        <GlassCard style={{ padding: '1.5rem' }} delay={0.7}>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.1rem', fontWeight: 700, color: A.text, marginBottom: 16 }}>Top Dealers</p>
          {topDealers.map((d, i) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: [A.gold, A.muted, A.subtle][i] + '33',
                border: `1px solid ${[A.gold, A.muted, A.subtle][i]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'IBM Plex Mono', fontSize: 11, color: [A.gold, A.muted, A.subtle][i],
              }}>{i+1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: A.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</p>
                <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>₹{d.totalEarned.toLocaleString('en-IN')}</p>
              </div>
              <ABadge color={A.green}>{d.members.length} mbr</ABadge>
            </div>
          ))}
        </GlassCard>
      </div>

      {/* Recent activity */}
      <GlassCard style={{ padding: '1.5rem' }} delay={0.75}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', fontWeight: 700, color: A.text }}>Recent Activity</p>
          <button onClick={() => onNavigate('audit')} style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.gold, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}>
            VIEW ALL →
          </button>
        </div>
        <div>
          {recentActivity.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.04 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${A.border}22` }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: A.gold, flexShrink: 0 }} />
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.gold, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 120 }}>{log.action.replace(/_/g,' ')}</span>
              <span style={{ fontSize: 12, color: A.muted, flex: 1 }}>{log.entity} {log.entityId}</span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.subtle }}>{new Date(log.ts).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

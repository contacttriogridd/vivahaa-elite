import React, { useEffect, useState } from 'react'
import { ADMIN } from '../data.js'
import { adminApi } from './apiClient.js'
import { ABtn, ABadge, StatusBadge, ATable, AModal, AInput, SectionHeader, GlassCard, Toast } from './ui.jsx'
import { ROLE_LABELS } from './rbac.js'

const A = ADMIN
const ROLES = ['HR_ADMIN', 'USER_MANAGEMENT', 'VENDOR_MANAGEMENT', 'DEALER_MANAGEMENT']
const ROLE_COLORS = { HR_ADMIN: A.gold, USER_MANAGEMENT: A.blue, VENDOR_MANAGEMENT: A.cyan, DEALER_MANAGEMENT: A.purple }

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER_MANAGEMENT' })
  const [toast, setToast] = useState(null)

  const load = () => adminApi.get('/admin/employees').then(({ data }) => setEmployees(data.employees)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const addEmployee = async () => {
    try {
      await adminApi.post('/admin/employees', form)
      setShowAdd(false)
      setForm({ name: '', email: '', password: '', role: 'USER_MANAGEMENT' })
      setToast({ message: 'Employee created', type: 'success' })
      load()
    } catch (e) {
      setToast({ message: e.response?.data?.message || 'Failed to create employee', type: 'error' })
    }
  }

  const toggleActive = async (emp) => {
    try {
      await adminApi.patch(`/admin/employees/${emp.id}`, { active: !emp.active })
      setToast({ message: `Employee ${emp.active ? 'deactivated' : 'reactivated'}`, type: emp.active ? 'error' : 'success' })
      load()
    } catch (e) {
      setToast({ message: e.response?.data?.message || 'Failed to update', type: 'error' })
    }
  }

  const cols = [
    { key: 'name', label: 'Employee', render: (v, row) => (
      <div>
        <p style={{ fontWeight: 600, color: A.text, fontSize: 13 }}>{v}</p>
        <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>{row.email}</p>
      </div>
    )},
    { key: 'employeeCode', label: 'ID', render: (v) => <ABadge color={A.gold}>{v}</ABadge> },
    { key: 'role', label: 'Role', render: (v) => <ABadge color={ROLE_COLORS[v]}>{ROLE_LABELS[v]}</ABadge> },
    { key: 'active', label: 'Status', render: (v) => <StatusBadge status={v ? 'active' : 'suspended'} /> },
    { key: 'createdAt', label: 'Since', render: (v) => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: A.muted }}>{new Date(v).toLocaleDateString('en-IN')}</span> },
    { key: 'id', label: '', render: (v, row) => (
      <ABtn size="sm" variant={row.active ? 'danger' : 'success'} onClick={() => toggleActive(row)}>
        {row.active ? 'Deactivate' : 'Reactivate'}
      </ABtn>
    )},
  ]

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <SectionHeader
        title="Employee Management"
        sub={`${employees.length} employee${employees.length === 1 ? '' : 's'}`}
        actions={[<ABtn key="add" variant="primary" icon="+" onClick={() => setShowAdd(true)}>Add Employee</ABtn>]}
      />

      <GlassCard style={{ padding: '0.5rem 0' }}>
        {loading ? <p style={{ padding: '2rem', textAlign: 'center', color: A.muted }}>Loading…</p> : <ATable columns={cols} rows={employees} />}
      </GlassCard>

      <AModal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Employee">
        <AInput label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <AInput label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
        <AInput label="Temporary Password" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} />
        <AInput label="Role" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} options={ROLES} />
        <p style={{ fontSize: 11, color: A.muted, marginBottom: 14, fontStyle: 'italic' }}>
          An Employee ID (e.g. E00{employees.length + 1}) is generated automatically on save.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <ABtn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</ABtn>
          <ABtn variant="primary" onClick={addEmployee}>Create Employee</ABtn>
        </div>
      </AModal>
    </div>
  )
}

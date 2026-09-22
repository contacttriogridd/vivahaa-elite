// Frontend mirror of server/lib/rbac.js's per-section access — used to hide nav
// items and gate page rendering. This is UI convenience only; the real enforcement
// is server-side (every /api/admin/* route checks the role itself), so this list
// drifting from the backend would only ever hide/show a link, never actually grant
// or deny data access.
//
// Sections not listed here (packages, gifts, horoscope, reports, audit, settings —
// the pre-existing mock pages outside this task's 7 tasks) default to HR_ADMIN-only,
// the safe default for anything not explicitly scoped to a role.
export const SECTION_ROLES = {
  // Shared landing page every role sees on login — not itself one of Task 7's
  // scoped sections, so it stays open to all rather than defaulting to HR-only.
  overview: ['HR_ADMIN', 'USER_MANAGEMENT', 'VENDOR_MANAGEMENT', 'DEALER_MANAGEMENT'],
  users: ['HR_ADMIN', 'USER_MANAGEMENT'],
  engagement: ['HR_ADMIN', 'USER_MANAGEMENT'],
  'post-match': ['HR_ADMIN', 'USER_MANAGEMENT'],
  payments: ['HR_ADMIN'],
  enquiries: ['HR_ADMIN'],
  dealers: ['HR_ADMIN', 'DEALER_MANAGEMENT'],
  vendors: ['HR_ADMIN', 'VENDOR_MANAGEMENT'],
  employees: ['HR_ADMIN'],
}

export function canAccessSection(role, sectionId) {
  const allowed = SECTION_ROLES[sectionId] || ['HR_ADMIN']
  return role === 'HR_ADMIN' || allowed.includes(role)
}

export const ROLE_LABELS = {
  HR_ADMIN: 'HR / Full Admin',
  USER_MANAGEMENT: 'User Management',
  VENDOR_MANAGEMENT: 'Vendor Management',
  DEALER_MANAGEMENT: 'Dealer Management',
}

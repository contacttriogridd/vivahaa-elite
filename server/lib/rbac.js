// Auth + RBAC for the admin panel's two new login surfaces: Employees (admin panel,
// role-scoped) and Vendors (self-service portal, own-data-only). Deliberately
// separate from server/index.js's authMiddleware (User) — a User JWT must never be
// accepted here, and vice versa, so every token carries a `type` claim and every
// middleware below checks it.
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'fallback-secret'

export const EMPLOYEE_ROLES = ['HR_ADMIN', 'USER_MANAGEMENT', 'VENDOR_MANAGEMENT', 'DEALER_MANAGEMENT']

export function signEmployeeToken(employee) {
  return jwt.sign(
    { id: employee.id, type: 'employee', role: employee.role },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '8h' }
  )
}

export function signVendorToken(vendor) {
  return jwt.sign(
    { id: vendor.id, type: 'vendor' },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '8h' }
  )
}

// Distinct cookie names from server/index.js's member `accessToken` cookie —
// employee, vendor, and member sessions can otherwise coexist in the same browser
// (e.g. an admin previewing the public site) and must not overwrite one another.
const bearerToken = (cookieName) => (req) => req.cookies?.[cookieName] || req.headers.authorization?.split(' ')[1]
const employeeBearerToken = bearerToken('employeeAccessToken')
const vendorBearerToken = bearerToken('vendorAccessToken')

/** Verifies an employee JWT and loads the active Employee row onto req.employee. */
export function authenticateEmployee(prisma) {
  return async (req, res, next) => {
    try {
      const token = employeeBearerToken(req)
      if (!token) return res.status(401).json({ message: 'Authentication required' })
      const decoded = jwt.verify(token, SECRET)
      if (decoded.type !== 'employee') return res.status(401).json({ message: 'Invalid token' })
      const employee = await prisma.employee.findUnique({ where: { id: decoded.id } })
      if (!employee || !employee.active) return res.status(401).json({ message: 'Employee not found or inactive' })
      req.employee = employee
      next()
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }
  }
}

/** Must run after authenticateEmployee. HR_ADMIN always passes, regardless of the allow-list. */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.employee) return res.status(401).json({ message: 'Authentication required' })
    if (req.employee.role === 'HR_ADMIN' || allowedRoles.includes(req.employee.role)) return next()
    return res.status(403).json({ message: 'Insufficient permissions for this section' })
  }
}

/** Verifies a vendor JWT and loads the active Vendor row onto req.vendor. */
export function authenticateVendor(prisma) {
  return async (req, res, next) => {
    try {
      const token = vendorBearerToken(req)
      if (!token) return res.status(401).json({ message: 'Authentication required' })
      const decoded = jwt.verify(token, SECRET)
      if (decoded.type !== 'vendor') return res.status(401).json({ message: 'Invalid token' })
      const vendor = await prisma.vendor.findUnique({ where: { id: decoded.id } })
      if (!vendor) return res.status(401).json({ message: 'Vendor not found' })
      req.vendor = vendor
      next()
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }
  }
}

/**
 * Writes an AuditLog row attributing an admin-panel action to the acting employee.
 * Reuses the existing AuditLog model (adminId already exists as a loose string, not
 * a relation) rather than adding a new table — see Task 7's audit-trail requirement.
 */
export async function logEmployeeAction(prisma, employee, { action, entity, entityId, details, ip }) {
  await prisma.auditLog.create({
    data: { adminId: employee.id, action, entity, entityId, details, ip },
  })
}

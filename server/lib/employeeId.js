// Employee ID scheme: E + 3-digit sequence, e.g. "E001". Same pattern as
// server/lib/vendorId.js (Employee.sequenceNo autoincrement -> two-step
// create-then-update inside one transaction so the id is assigned server-side and
// never reused).
const SEQUENCE_DIGITS = 3
const MAX_SEQUENCE = 10 ** SEQUENCE_DIGITS - 1

export function formatEmployeeId(sequenceNo) {
  return `E${String(sequenceNo).padStart(SEQUENCE_DIGITS, '0')}`
}

export async function createEmployeeWithId(prisma, data) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.employee.create({
      data: { ...data, employeeCode: `__pending_${Date.now()}_${Math.random()}` },
    })
    if (created.sequenceNo > MAX_SEQUENCE) {
      throw new Error(`Employee sequence ${created.sequenceNo} exceeds ${SEQUENCE_DIGITS}-digit capacity — bump SEQUENCE_DIGITS`)
    }
    return tx.employee.update({
      where: { id: created.id },
      data: { employeeCode: formatEmployeeId(created.sequenceNo) },
    })
  })
}

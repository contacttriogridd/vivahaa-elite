/**
 * MSG91 transactional SMS client. Needs MSG91_AUTH_KEY / MSG91_SENDER_ID /
 * MSG91_TEMPLATE_ID (see .env.example) — a DLT-registered template id is required
 * for transactional SMS to Indian numbers, which MSG91's dashboard issues once the
 * template text is approved. Without those set, sendSms logs instead of sending —
 * the payment webhook must never fail just because SMS isn't configured.
 */
const hasMsg91Config = () =>
  Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID && process.env.MSG91_TEMPLATE_ID)

/** `mobile` is a 10-digit Indian number without the country code, matching the wizard's input. */
export async function sendSms({ mobile, variables }) {
  if (!hasMsg91Config()) {
    console.log(`[sms] MSG91 not configured — would have sent template ${process.env.MSG91_TEMPLATE_ID || '(none)'} to ${mobile}`, variables)
    return { sent: false }
  }

  const res = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: process.env.MSG91_AUTH_KEY },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      sender: process.env.MSG91_SENDER_ID,
      recipients: [{ mobiles: `91${mobile}`, ...variables }],
    }),
  })
  if (!res.ok) {
    console.error('[sms] MSG91 send failed', res.status, await res.text().catch(() => ''))
    return { sent: false }
  }
  return { sent: true }
}

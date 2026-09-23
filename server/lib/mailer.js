import nodemailer from 'nodemailer'

/**
 * Lazily-created singleton transport, built from the SMTP_* env vars that already
 * exist in .env.example but were never wired to an actual nodemailer transport
 * before this. If SMTP_HOST/USER/PASS aren't set (e.g. local dev with no mail
 * account), sendMail logs to the console instead of throwing — the payment webhook
 * must never fail just because outbound mail isn't configured.
 */
let transport = null
const hasSmtpConfig = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

const getTransport = () => {
  if (!hasSmtpConfig()) return null
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transport
}

export async function sendMail({ to, subject, html, text }) {
  const client = getTransport()
  if (!client) {
    console.log(`[mailer] SMTP not configured — would have sent "${subject}" to ${to}`)
    return { sent: false }
  }
  await client.sendMail({ from: process.env.SMTP_FROM || 'noreply@vivahaaelite.com', to, subject, html, text })
  return { sent: true }
}

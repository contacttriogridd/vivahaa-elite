import React, { useEffect, useRef, useState } from 'react'
import { Loader2, ShieldCheck, RefreshCw, FlaskConical } from 'lucide-react'
import { Button } from '../../components/ui/button'
import API from '../../lib/api'
import type { PlanTier } from '../../lib/plans'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: () => void) => void }
  }
}

const CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 45 // ~90s of polling before we give up and ask the member to check back

/** Only ever injected once — Step 5 mounting this component is the sole trigger, so
 * Razorpay's script never ships in the main bundle or loads before this step. */
function loadCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Could not load payment gateway')))
      return
    }
    const script = document.createElement('script')
    script.src = CHECKOUT_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load payment gateway'))
    document.body.appendChild(script)
  })
}

type Phase = 'idle' | 'starting' | 'awaiting-webhook' | 'error'

export function RazorpayCheckout({
  draftToken,
  planTier,
  payerName,
  payerEmail,
  payerMobile,
  canPay,
  onPaid,
}: {
  draftToken: string
  planTier: PlanTier
  payerName: string
  payerEmail: string
  payerMobile: string
  /** False while a required step (accepting the terms) hasn't happened yet — the
   * button still shows so "complete payment" is always the visible next step right
   * after picking a package, it's just disabled with an inline hint until then. */
  canPay: boolean
  onPaid: () => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [demoAvailable, setDemoAvailable] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const pollCount = useRef(0)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (pollTimer.current) clearInterval(pollTimer.current)
  }, [])

  const pollForConfirmation = () => {
    setPhase('awaiting-webhook')
    pollCount.current = 0
    pollTimer.current = setInterval(async () => {
      pollCount.current += 1
      try {
        const { data } = await API.get(`/registration/draft/${draftToken}/status`)
        if (data.status === 'paid') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          onPaid()
          return
        }
      } catch {
        // transient network hiccup — keep polling, the interval will just try again
      }
      if (pollCount.current >= MAX_POLLS) {
        if (pollTimer.current) clearInterval(pollTimer.current)
        setError(
          'Your payment is taking longer than expected to confirm. If the amount was debited, it will reflect shortly — you can also refresh and check back.'
        )
        setPhase('error')
      }
    }, POLL_INTERVAL_MS)
  }

  const startCheckout = async () => {
    setPhase('starting')
    setError('')
    setDemoAvailable(false)
    try {
      await loadCheckoutScript()
      const { data: order } = await API.post('/payments/razorpay/order', { draftToken, planTier })

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: { name: payerName, email: payerEmail, contact: payerMobile },
        theme: { color: '#D4AF37' },
        // The client-side handler is only ever a hint to start polling — the actual
        // account creation happens server-side once the webhook verifies payment (see
        // server/routes/payments.js). We never trust this callback on its own.
        handler: () => pollForConfirmation(),
        modal: {
          ondismiss: () => setPhase('idle'),
        },
      })
      razorpay.on('payment.failed', () => {
        setError('Payment was not completed. You can try again — nothing you filled in has been lost.')
        setPhase('error')
      })
      razorpay.open()
      setPhase('idle')
    } catch (err) {
      const response = (err as { response?: { data?: { message?: string; demoAvailable?: boolean } } }).response
      setError(response?.data?.message || (err instanceof Error ? err.message : 'Unable to start payment right now.'))
      setDemoAvailable(Boolean(response?.data?.demoAvailable))
      setPhase('error')
    }
  }

  /** Dev/staging fallback for when no real Razorpay keys are configured yet — see
   * POST /api/payments/demo/complete, which 404s outright in production. Goes through
   * the exact same account-creation transaction the real webhook triggers, so this
   * exercises the whole flow (draft -> User -> redirect to login) end to end. */
  const completeDemoPayment = async () => {
    setDemoBusy(true)
    setError('')
    try {
      await API.post('/payments/demo/complete', { draftToken, planTier })
      onPaid()
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setError(message || 'Demo payment could not be completed.')
    } finally {
      setDemoBusy(false)
    }
  }

  if (phase === 'awaiting-webhook') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-royal-gold/20 bg-royal-gold/5 p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-royal-gold" />
        <p className="font-playfair text-lg text-elite-text">Confirming your payment…</p>
        <p className="max-w-sm text-sm text-elite-muted">
          This usually takes a few seconds. Please don&apos;t close this page.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="elite"
        size="lg"
        className="w-full"
        disabled={phase === 'starting' || !canPay}
        onClick={startCheckout}
      >
        {phase === 'starting' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Starting secure checkout…
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" /> Complete Payment
          </>
        )}
      </Button>

      {!canPay && (
        <p className="text-center text-xs text-elite-muted">
          Accept the terms above to complete your payment.
        </p>
      )}

      {error && (
        <div className="space-y-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <div className="flex items-start gap-2">
            <span className="flex-1">{error}</span>
            <button type="button" onClick={startCheckout} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
          {demoAvailable && (
            <Button type="button" variant="outline" size="sm" className="w-full" disabled={demoBusy} onClick={completeDemoPayment}>
              {demoBusy ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Completing demo payment…
                </>
              ) : (
                <>
                  <FlaskConical className="h-3.5 w-3.5" /> Continue with test payment (no Razorpay keys set)
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-elite-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-royal-gold" /> Secured by Razorpay — UPI, cards, net banking,
        wallets, and EMI all supported.
      </p>
    </div>
  )
}

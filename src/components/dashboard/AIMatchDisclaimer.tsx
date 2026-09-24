import React from 'react'
import { AlertTriangle } from 'lucide-react'
import type { DashboardTheme } from '../../lib/dashboardTheme'

/**
 * Mandatory compliance banner (Panel 3.5) — renders wherever AI best-match results
 * are shown. The exact wording always comes from the API response's `disclaimer`
 * field (server/lib/horoscopeCompatibility.js's AI_MATCH_DISCLAIMER is the single
 * source of truth), never hardcoded here, so the two can't drift. This component's
 * job is only to make sure it's actually rendered, every time, non-dismissibly —
 * not tucked behind a tooltip or a one-time toast.
 */
export function AIMatchDisclaimer({ theme: t, text }: { theme: DashboardTheme; text: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 ${t.text}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
      <p className="text-xs leading-relaxed">{text}</p>
    </div>
  )
}

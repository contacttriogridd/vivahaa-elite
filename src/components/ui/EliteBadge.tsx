import React from 'react'

/**
 * Small crown motif shown next to an Elite member's name. SVG, not an image asset —
 * per this project's imagery decision, panel treatments stay CSS/SVG until real
 * photography is supplied.
 */
export function EliteBadge({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-label="Elite member"
    >
      <path
        d="M3 8.5 7 11l5-6 5 6 4-2.5-1.5 9.5h-15L3 8.5Z"
        fill="currentColor"
        fillOpacity={0.15}
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <path d="M4.5 19h15" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  )
}

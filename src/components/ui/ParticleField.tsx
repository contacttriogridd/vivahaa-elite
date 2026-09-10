import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const PETALS = ['🌸', '✨', '🌺', '💫', '🪷']

const particleAnimation = { y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }
const petalAnimation = { y: [0, -120], x: [0, 60, -60, 0], opacity: [0, 0.6, 0], rotate: [0, 360] }

interface ParticleFieldProps {
  /** Floating gold dots. */
  particleCount?: number
  /** Floating flower/sparkle emoji, rising from the bottom. Set to 0 to disable. */
  petalCount?: number
  className?: string
}

/**
 * Extracted from PremiumLogin.tsx, which had this bespoke to its own file. Reused
 * as the "subtle animated shimmer" backdrop for the Elite dashboard (Phase 4) —
 * kept deliberately subtle (low opacity, slow, `pointer-events-none`) so it reads
 * as ambient texture, not a distraction layered over real content.
 *
 * Randomized positions/delays are computed once via useMemo so the field doesn't
 * reshuffle on every parent re-render.
 */
export function ParticleField({ particleCount = 20, petalCount = 5, className = '' }: ParticleFieldProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 2,
      })),
    [particleCount]
  )

  const petals = useMemo(
    () =>
      Array.from({ length: petalCount }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        duration: 8 + Math.random() * 6,
        delay: i * 1.5,
        glyph: PETALS[i % PETALS.length],
      })),
    [petalCount]
  )

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-royal-gold/30"
          style={{ left: p.left, top: p.top }}
          animate={particleAnimation}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
        />
      ))}
      {petals.map((p, i) => (
        <motion.div
          key={`petal-${i}`}
          className="absolute select-none text-2xl"
          style={{ left: p.left, top: '100%' }}
          animate={petalAnimation}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
        >
          {p.glyph}
        </motion.div>
      ))}
    </div>
  )
}

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export function GlassCard({ children, className, glow, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'glass-card dark:glass-card-dark p-6',
        glow && 'shadow-[0_0_40px_rgba(212,175,55,0.12)] border-royal-gold/30',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

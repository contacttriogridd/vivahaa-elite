import React, { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

type ButtonVariant = 'default' | 'primary' | 'ghost' | 'outline' | 'elite' | 'danger' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  default: 'bg-royal-gold text-ivory hover:bg-royal-gold/90 premium-shadow',
  primary: 'bg-std-primary text-white hover:bg-std-primary/90',
  ghost: 'bg-transparent text-std-muted border border-std-border hover:bg-std-bg',
  outline: 'bg-transparent border border-royal-gold text-royal-gold hover:bg-royal-gold/10',
  elite: 'bg-elite-gold text-elite-bg hover:bg-elite-gold/90',
  danger: 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20',
  link: 'bg-transparent text-royal-gold underline-offset-4 hover:underline',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
  xl: 'px-10 py-5 text-lg',
}

export function Button({ children, variant = 'default', size = 'md', className, disabled, icon, onClick, type = 'button', ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      disabled={disabled}
      type={type}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-royal-gold/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...(props as any)}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </motion.button>
  )
}

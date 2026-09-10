import React, { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-std-muted dark:text-elite-muted mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-std-muted dark:text-elite-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm font-inter transition-all duration-300 input-premium',
              'bg-white/80 dark:bg-elite-bg/80 text-std-text dark:text-elite-text',
              'placeholder:text-std-muted/50 dark:placeholder:text-elite-muted/50',
              'focus:border-royal-gold focus:ring-2 focus:ring-royal-gold/20 focus:outline-none',
              icon && 'pl-10',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

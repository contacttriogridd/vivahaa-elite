import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface ComboboxOption {
  id: string
  label: string
}

interface ComboboxProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  disabled?: boolean
  error?: string
  helperText?: React.ReactNode
  /** When true, a typed value that matches no option is kept as-is. */
  allowCustom?: boolean
  /** Shown in place of the list when `options` is empty. */
  emptyMessage?: string
  className?: string
}

const normalize = (s: string) => s.toLowerCase().trim()

/**
 * Type-to-filter select. Clicking the field (or its arrow) opens the full list;
 * typing narrows it. Unlike a plain <select> it stays usable at 150+ options,
 * which the caste and kulam lists both reach.
 */
export function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select or type to search',
  disabled,
  error,
  helperText,
  allowCustom = false,
  emptyMessage = 'No options available yet',
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const selectedLabel = useMemo(
    () => options.find((o) => o.id === value)?.label ?? value,
    [options, value]
  )

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return options
    const starts = options.filter((o) => normalize(o.label).startsWith(q))
    const contains = options.filter(
      (o) => !normalize(o.label).startsWith(q) && normalize(o.label).includes(q)
    )
    return [...starts, ...contains]
  }, [options, query])

  // Close on outside click. Any pending free text is committed or discarded on the
  // way out so the field never shows text that isn't the stored value.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return
      commitAndClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  })

  useEffect(() => {
    setHighlighted(0)
  }, [query, open])

  const select = (option: ComboboxOption) => {
    onChange(option.id)
    setQuery('')
    setOpen(false)
  }

  const commitAndClose = () => {
    const typed = query.trim()
    if (typed) {
      const exact = options.find((o) => normalize(o.label) === normalize(typed))
      if (exact) onChange(exact.id)
      else if (allowCustom) onChange(typed)
    }
    setQuery('')
    setOpen(false)
  }

  const openList = () => {
    if (disabled) return
    setOpen(true)
    inputRef.current?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (!filtered.length) return
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setHighlighted((prev) => (prev + delta + filtered.length) % filtered.length)
      return
    }
    if (event.key === 'Enter') {
      if (!open) return
      event.preventDefault()
      if (filtered[highlighted]) select(filtered[highlighted])
      else commitAndClose()
      return
    }
    if (event.key === 'Escape') {
      setQuery('')
      setOpen(false)
      return
    }
    if (event.key === 'Tab') commitAndClose()
  }

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-std-muted dark:text-elite-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={open ? query : selectedLabel}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={openList}
          onClick={openList}
          onKeyDown={onKeyDown}
          className={cn(
            'input-premium w-full rounded-xl px-4 py-3 pr-10 text-sm font-inter transition-all duration-300',
            'bg-white/80 dark:bg-elite-bg/80 text-std-text dark:text-elite-text',
            'placeholder:text-std-muted/50 dark:placeholder:text-elite-muted/50',
            'focus:border-royal-gold focus:outline-none focus:ring-2 focus:ring-royal-gold/20',
            disabled && 'cursor-not-allowed opacity-50',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Close options' : 'Show options'}
          disabled={disabled}
          onClick={() => (open ? commitAndClose() : openList())}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-std-muted dark:text-elite-muted disabled:opacity-40"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
        </button>

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-royal-gold/25 bg-white p-1 shadow-lg dark:bg-elite-panel"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-std-muted dark:text-elite-muted">
                {options.length === 0
                  ? emptyMessage
                  : allowCustom
                    ? `Press Enter to use “${query.trim()}”`
                    : 'No matches'}
              </li>
            )}
            {filtered.map((option, index) => (
              <li key={option.id} role="option" aria-selected={option.id === value}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => select(option)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm',
                    'text-std-text dark:text-elite-text',
                    index === highlighted && 'bg-royal-gold/10'
                  )}
                >
                  <span>{option.label}</span>
                  {option.id === value && <Check className="h-3.5 w-3.5 shrink-0 text-royal-gold" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
      {!error && helperText && (
        <p className="mt-1.5 text-xs leading-relaxed text-std-muted dark:text-elite-muted">{helperText}</p>
      )}
    </div>
  )
}

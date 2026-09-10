import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { ThemeContextType } from '../types'

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'elite' | 'standard'>(() =>
    (localStorage.getItem('vivahaa-theme') as 'elite' | 'standard') || 'elite'
  )

  useEffect(() => {
    localStorage.setItem('vivahaa-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'elite' ? 'standard' : 'elite'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

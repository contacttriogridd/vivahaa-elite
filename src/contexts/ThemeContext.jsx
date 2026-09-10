import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('vivahaa-theme') || 'elite')

  useEffect(() => { localStorage.setItem('vivahaa-theme', theme); document.documentElement.setAttribute('data-theme', theme) }, [theme])

  const toggleTheme = () => setTheme(t => t === 'elite' ? 'standard' : 'elite')

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  tier: string
  plan: string
  role?: string
  profileCompletion?: number
  emailVerified?: boolean
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResponse>
  loginWithGoogle: () => void
  logout: () => Promise<void>
  register: (data: Record<string, unknown>) => Promise<LoginResponse>
  setUser: (user: User | null) => void
}

export interface ThemeContextType {
  theme: 'elite' | 'standard'
  setTheme: (t: 'elite' | 'standard') => void
  toggleTheme: () => void
}

export interface DailyQuote {
  text: string
  author: string
}

export interface TrustBadge {
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
}

export interface StatItem {
  value: string
  label: string
}

export interface AIChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface PasswordStrength {
  level: number
  label: string
  color: string
  textColor: string
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

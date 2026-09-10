/**
 * Matches GET /api/auth/profile's response shape — the authenticated user's own
 * full profile, including their own PrivateProfile fields under `private`. Never
 * reuse this shape for another user's profile (the browse/search route in Phase 5
 * returns a narrower, privacy-respecting projection instead).
 */
export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  tier: string
  /** Matches prisma's PlanTier enum, e.g. "GOLD" | "PLATINUM_PLUS" — see src/lib/plans.ts. */
  plan: string
  role?: string
  profileCompletion?: number
  emailVerified?: boolean

  phone?: string | null
  phoneVerified?: boolean
  gender?: string | null
  dob?: string | null
  religion?: string | null
  caste?: string | null
  subcaste?: string | null
  kulam?: string | null
  motherTongue?: string | null
  familyType?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  education?: string | null
  occupation?: string | null
  income?: string | null
  height?: string | null
  weight?: string | null
  bloodGroup?: string | null
  foodPreference?: string | null
  hobbies?: string | null
  lifestyleInterests?: string | null
  languagesKnown?: string | null
  languagePreference?: string | null
  partnerAgeRange?: string | null
  partnerReligion?: string | null
  partnerLocation?: string | null
  nakshatra?: string | null
  rashi?: string | null
  birthTime?: string | null
  birthPlace?: string | null
  noHoroscopeChart?: boolean
  idVerified?: boolean
  photoVerified?: boolean
  videoVerified?: boolean
  photoVisibility?: string
  status?: string
  createdAt?: string

  /** The signed-in user's own private data — see the note on GET /api/auth/profile. */
  private?: {
    maritalStatus: string | null
    hasChildren: boolean
    divorceDecreeConfirmed: boolean
    widowDeclarationConfirmed: boolean
    spousePassedOn: string | null
    totalAssetValue: string | null
  } | null
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

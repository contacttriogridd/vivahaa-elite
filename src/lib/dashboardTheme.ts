import { planByTier } from './plans'

/**
 * The Standard/Elite dashboard theme, as literal class sets rather than Tailwind's
 * dark: variant — see the note in src/pages/Dashboard.tsx for why. Shared here so
 * every dashboard-area component (Dashboard itself, BrowseProfiles, and whatever
 * comes later) renders the same theme from the same source instead of each
 * re-deriving its own ternary.
 */
export interface DashboardTheme {
  isElite: boolean
  page: string
  heading: string
  eyebrow: string
  body: string
  card: string
  cardHeading: string
  muted: string
  text: string
  border: string
  accentBg: string
  accentText: string
  badgePill: string
  track: string
  inputField: string
}

export function getDashboardTheme(planTier: string | undefined | null): DashboardTheme {
  const plan = planTier ? planByTier(planTier) : undefined
  const isElite = plan?.group === 'elite'

  return isElite
    ? {
        isElite,
        page: 'bg-elite-bg',
        heading: 'font-playfair text-elite-text',
        eyebrow: 'text-royal-gold',
        body: 'font-inter',
        card: 'border border-royal-gold/20 bg-elite-panel/90 backdrop-blur-xl',
        cardHeading: 'font-playfair text-elite-text',
        muted: 'text-elite-muted',
        text: 'text-elite-text',
        border: 'border-elite-border',
        accentBg: 'bg-royal-gold',
        accentText: 'text-royal-gold',
        badgePill: 'border-royal-gold/40 bg-royal-gold/10 text-royal-gold',
        track: 'bg-elite-border',
        inputField: 'border border-royal-gold/20 bg-elite-bg/60 text-elite-text placeholder:text-elite-muted/60',
      }
    : {
        isElite,
        page: 'bg-std-bg',
        heading: 'font-cormorant text-std-primary',
        eyebrow: 'text-std-gold',
        body: 'font-inter',
        card: 'border border-std-border bg-white/80 backdrop-blur-sm',
        cardHeading: 'font-playfair text-std-text',
        muted: 'text-std-muted',
        text: 'text-std-text',
        border: 'border-std-border',
        accentBg: 'bg-std-gold',
        accentText: 'text-std-primary',
        badgePill: 'border-std-gold/40 bg-std-gold/10 text-std-primary',
        track: 'bg-std-border',
        inputField: 'border border-std-border bg-white text-std-text placeholder:text-std-muted/60',
      }
}

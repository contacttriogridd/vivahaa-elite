import API from './api'

/**
 * Horoscope chart computation.
 *
 * ─── ARCHITECTURE RULE ──────────────────────────────────────────────────────────
 * A language model must NEVER produce the planetary positions in a chart. Asked for
 * them it will return confident, well-formatted, astronomically wrong numbers, and
 * nothing downstream can tell the difference. Users make marriage decisions on this.
 *
 * Positions come from one place only: an ephemeris-backed calculation, called through
 * `POST /api/horoscope/compute` on our own backend. That endpoint is a STUB today —
 * it returns 501 until a real library or API is wired in. See the note on that route
 * in server/index.js for the integration options.
 *
 * An LLM may be used for exactly one thing here, and only after the numbers exist:
 * turning an already-computed `HoroscopeChart` into readable prose. That path is
 * `summariseChart()` below, which takes a computed chart as its input and cannot be
 * called without one.
 * ────────────────────────────────────────────────────────────────────────────────
 */

export const RASIS = [
  'Mesha',
  'Vrishabha',
  'Mithuna',
  'Kataka',
  'Simha',
  'Kanya',
  'Tula',
  'Vrischika',
  'Dhanus',
  'Makara',
  'Kumbha',
  'Meena',
] as const

export type Rasi = (typeof RASIS)[number]

export const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const

export interface BirthDetails {
  /** ISO date, YYYY-MM-DD */
  date: string
  /** 24h local time at the place of birth, HH:MM */
  time: string
  place: string
}

export interface PlanetPlacement {
  planet: string
  sign: Rasi
  /** Degrees within the sign, 0–30. */
  degree?: number
  retrograde?: boolean
  house?: number
}

export interface HoroscopeChart {
  style: 'south-indian' | 'north-indian'
  ascendantSign: Rasi
  rasi: Rasi
  nakshatra: string
  nakshatraPada?: number
  placements: PlanetPlacement[]
  /** Which engine produced this, recorded so a chart can always be traced. */
  computedBy: string
  computedAt: string
}

/** Thrown when no calculation engine is configured. Never fall back to a guess. */
export class HoroscopeUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HoroscopeUnavailableError'
  }
}

const INTEGRATION_MESSAGE =
  'Chart generation is not connected yet. It needs an ephemeris-backed calculation service on the backend — we will not estimate planetary positions.'

export async function computeHoroscope(details: BirthDetails): Promise<HoroscopeChart> {
  if (!details.date || !details.time || !details.place) {
    throw new HoroscopeUnavailableError(
      'Date, exact time, and place of birth are all required to compute a chart.'
    )
  }

  try {
    const { data } = await API.post<HoroscopeChart>('/horoscope/compute', details)
    if (!data?.placements?.length) {
      throw new HoroscopeUnavailableError(INTEGRATION_MESSAGE)
    }
    return data
  } catch (error: unknown) {
    if (error instanceof HoroscopeUnavailableError) throw error
    const status = (error as { response?: { status?: number; data?: { message?: string } } })
      .response?.status
    const serverMessage = (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message
    if (status === 501) throw new HoroscopeUnavailableError(serverMessage || INTEGRATION_MESSAGE)
    throw new HoroscopeUnavailableError(
      serverMessage || 'Could not reach the chart service. Please try again.'
    )
  }
}

/**
 * Optional, and strictly second in line: hand an ALREADY-COMPUTED chart to the backend
 * to be described in plain language. The chart is the input, so this cannot be used to
 * conjure positions — if `computeHoroscope` has not run, there is nothing to summarise.
 */
export async function summariseChart(chart: HoroscopeChart): Promise<string> {
  const { data } = await API.post<{ summary: string }>('/horoscope/summarise', { chart })
  return data.summary
}

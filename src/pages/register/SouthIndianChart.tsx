import React from 'react'
import { RASIS, type HoroscopeChart, type Rasi } from '../../lib/horoscope'

/**
 * South Indian style rasi chart: a fixed 4×4 grid with the middle four cells open.
 * Signs sit in fixed positions (they do not rotate with the ascendant, as they do in
 * the North Indian style) and the ascendant is marked instead.
 *
 * This component only draws what it is given. It never derives or infers a placement —
 * see the architecture note in src/lib/horoscope.ts.
 */

// Grid coordinates are [column, row], 0-indexed from the top-left.
const SIGN_CELLS: Record<Rasi, [number, number]> = {
  Meena: [0, 0],
  Mesha: [1, 0],
  Vrishabha: [2, 0],
  Mithuna: [3, 0],
  Kumbha: [0, 1],
  Kataka: [3, 1],
  Makara: [0, 2],
  Simha: [3, 2],
  Dhanus: [0, 3],
  Vrischika: [1, 3],
  Tula: [2, 3],
  Kanya: [3, 3],
}

/** Short glyphs keep long placement lists readable inside a 100×100 cell. */
const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
  Uranus: 'Ur',
  Neptune: 'Ne',
  Pluto: 'Pl',
}

const CELL = 92
const PAD = 6
const SIZE = CELL * 4 + PAD * 2

export function SouthIndianChart({ chart }: { chart: HoroscopeChart }) {
  const bySign = new Map<Rasi, string[]>()
  for (const placement of chart.placements) {
    const abbr = PLANET_ABBR[placement.planet] ?? placement.planet.slice(0, 2)
    const label = placement.retrograde ? `${abbr}℞` : abbr
    bySign.set(placement.sign, [...(bySign.get(placement.sign) ?? []), label])
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full max-w-md"
      role="img"
      aria-label={`South Indian rasi chart. Ascendant in ${chart.ascendantSign}.`}
    >
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="none" />

      {RASIS.map((sign) => {
        const [col, row] = SIGN_CELLS[sign]
        const x = PAD + col * CELL
        const y = PAD + row * CELL
        const isAscendant = sign === chart.ascendantSign
        const planets = bySign.get(sign) ?? []

        return (
          <g key={sign}>
            <rect
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              fill={isAscendant ? 'rgba(201,162,75,0.10)' : 'transparent'}
              stroke="rgba(201,162,75,0.45)"
              strokeWidth={1}
            />
            {isAscendant && (
              <line
                x1={x}
                y1={y}
                x2={x + 22}
                y2={y + 22}
                stroke="#C9A24B"
                strokeWidth={1.5}
              />
            )}
            <text
              x={x + 6}
              y={y + CELL - 7}
              fill="rgba(138,122,90,0.95)"
              fontSize={9}
              fontFamily="IBM Plex Mono, monospace"
              letterSpacing="0.06em"
            >
              {sign.toUpperCase()}
            </text>
            {planets.map((planet, index) => (
              <text
                key={planet + index}
                x={x + CELL / 2}
                y={y + 26 + index * 15}
                textAnchor="middle"
                fill="#C9A24B"
                fontSize={13}
                fontFamily="Inter, sans-serif"
                fontWeight={500}
              >
                {planet}
              </text>
            ))}
          </g>
        )
      })}

      {/* Centre panel — the four inner cells are one open square. */}
      <text
        x={SIZE / 2}
        y={SIZE / 2 - 8}
        textAnchor="middle"
        fill="rgba(138,122,90,0.9)"
        fontSize={10}
        fontFamily="IBM Plex Mono, monospace"
        letterSpacing="0.18em"
      >
        RASI · {chart.rasi.toUpperCase()}
      </text>
      <text
        x={SIZE / 2}
        y={SIZE / 2 + 10}
        textAnchor="middle"
        fill="rgba(138,122,90,0.9)"
        fontSize={10}
        fontFamily="IBM Plex Mono, monospace"
        letterSpacing="0.18em"
      >
        {chart.nakshatra.toUpperCase()}
        {chart.nakshatraPada ? ` · PADA ${chart.nakshatraPada}` : ''}
      </text>
      <text
        x={SIZE / 2}
        y={SIZE / 2 + 30}
        textAnchor="middle"
        fill="rgba(138,122,90,0.6)"
        fontSize={8}
        fontFamily="IBM Plex Mono, monospace"
      >
        {chart.computedBy}
      </text>
    </svg>
  )
}

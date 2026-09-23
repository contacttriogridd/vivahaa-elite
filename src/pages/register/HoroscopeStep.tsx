import React, { useState } from 'react'
import { AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Combobox } from '../../components/ui/combobox'
import { SouthIndianChart } from './SouthIndianChart'
import {
  NAKSHATRAS,
  RASIS,
  computeHoroscope,
  type HoroscopeChart,
} from '../../lib/horoscope'

interface HoroscopeStepProps {
  dob: string
  birthTime: string
  birthPlace: string
  nakshatra: string
  rasi: string
  noHoroscopeChart: boolean
  onChange: (field: string, value: unknown) => void
}

const asOptions = (values: readonly string[]) => values.map((value) => ({ id: value, label: value }))

export function HoroscopeStep({
  dob,
  birthTime,
  birthPlace,
  nakshatra,
  rasi,
  noHoroscopeChart,
  onChange,
}: HoroscopeStepProps) {
  const [chart, setChart] = useState<HoroscopeChart | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  const canGenerate = Boolean(dob && birthTime && birthPlace)

  const generate = async () => {
    setGenerating(true)
    setGenerateError('')
    setChart(null)
    try {
      const computed = await computeHoroscope({ date: dob, time: birthTime, place: birthPlace })
      setChart(computed)
      // Only adopt values that were actually computed, never a guess.
      if (computed.nakshatra) onChange('nakshatra', computed.nakshatra)
      if (computed.rasi) onChange('rasi', computed.rasi)
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Could not generate the chart.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Date of Birth"
          type="date"
          value={dob}
          onChange={(event) => onChange('dob', event.target.value)}
        />
        <Input
          label="Time of Birth"
          type="time"
          value={birthTime}
          onChange={(event) => onChange('birthTime', event.target.value)}
        />
        <Input
          label="Place of Birth"
          placeholder="Town or city, and state"
          value={birthPlace}
          onChange={(event) => onChange('birthPlace', event.target.value)}
          className="md:col-span-2"
        />
        <Combobox
          label="Nakshatra"
          value={nakshatra}
          onChange={(value) => onChange('nakshatra', value)}
          options={asOptions(NAKSHATRAS)}
          placeholder="Search the 27 nakshatras"
        />
        <Combobox
          label="Rasi / Moon sign"
          value={rasi}
          onChange={(value) => onChange('rasi', value)}
          options={asOptions(RASIS)}
          placeholder="Search the 12 rasis"
        />
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-royal-gold/20 bg-white/5 p-4 text-sm text-elite-text">
        <input
          type="checkbox"
          checked={noHoroscopeChart}
          onChange={(event) => onChange('noHoroscopeChart', event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-royal-gold/30 text-royal-gold"
        />
        <span>
          I don&apos;t have my horoscope chart
          <span className="mt-1 block text-xs text-elite-muted">
            We can calculate one from your birth details. Horoscope matching is optional on
            Vivahaa Elite — you can leave this whole step blank.
          </span>
        </span>
      </label>

      {noHoroscopeChart && (
        <div className="space-y-4 rounded-2xl border border-royal-gold/20 bg-royal-gold/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-playfair text-lg text-elite-text">
                Generate horoscope chart
              </p>
              <p className="mt-0.5 text-xs text-elite-muted">
                {canGenerate
                  ? 'Calculated from your date, exact time, and place of birth.'
                  : 'Fill in date, time, and place of birth first.'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGenerate || generating}
              onClick={generate}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Calculating
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate chart
                </>
              )}
            </Button>
          </div>

          {generateError && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{generateError}</span>
            </div>
          )}

          {chart && (
            <div className="space-y-3">
              <SouthIndianChart chart={chart} />
              <p className="text-[11px] leading-relaxed text-elite-muted">
                Computed from your birth details, not estimated. Please have a qualified
                jyotishi confirm anything you intend to act on.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, ShieldCheck } from 'lucide-react'
import API from '../../lib/api'
import { Input } from '../../components/ui/input'
import { Combobox } from '../../components/ui/combobox'
import { Button } from '../../components/ui/button'
import { getReligions, getCastes, getSubcastes } from '../../lib/taxonomy'
import { NAKSHATRAS, RASIS } from '../../lib/horoscope'
import cityGeo from '../../data/taxonomy/cityGeo.json'
import type { DashboardTheme } from '../../lib/dashboardTheme'

interface ProfileCard {
  id: string
  name: string | null
  avatar: string | null
  gender: string | null
  age: number | null
  religion: string | null
  caste: string | null
  subcaste: string | null
  motherTongue: string | null
  city: string | null
  education: string | null
  occupation: string | null
  height: string | null
  foodPreference: string | null
  nakshatra: string | null
  rashi: string | null
  idVerified: boolean
  photoVerified: boolean
  videoVerified: boolean
  profileCompletion: number
  maritalStatus?: string | null
  distanceKm?: number
}

const asOptions = (values: readonly string[]) => values.map((v) => ({ id: v, label: v }))
const cityOptions = Object.keys(cityGeo.cities).map((c) => ({ id: c, label: c }))

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest profiles' },
  { id: 'active', label: 'Recently active' },
  { id: 'age-asc', label: 'Age (youngest first)' },
  { id: 'age-desc', label: 'Age (oldest first)' },
]

const emptyFilters = {
  gender: '',
  ageMin: '',
  ageMax: '',
  religionId: '',
  casteId: '',
  subcasteId: '',
  motherTongue: '',
  maritalStatus: '',
  location: '',
  radiusCity: '',
  radiusKm: '',
  education: '',
  occupation: '',
  foodPreference: '',
  nakshatra: '',
  rashi: '',
  hasPhoto: false,
  verifiedOnly: false,
  sort: 'newest',
}

type Filters = typeof emptyFilters

/**
 * Filter bar + results grid for GET /api/profiles (Phase 5). Server-side filtering
 * and pagination throughout — this never fetches "everything" and filters client-
 * side, which would fall over the moment the member base grows past a page or two.
 *
 * Distance sort and the radius search only activate together (a radius needs a
 * center, and the backend only computes distance when both are given) — picking a
 * radius city is what supplies the center, since the platform doesn't have real
 * geocoding yet (see src/data/taxonomy/cityGeo.json).
 */
export function BrowseProfiles({ theme: t }: { theme: DashboardTheme }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [profiles, setProfiles] = useState<ProfileCard[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const castes = filters.religionId ? getCastes(filters.religionId) : []
  const subcastes = filters.religionId && filters.casteId ? getSubcastes(filters.religionId, filters.casteId) : []
  const isRadiusSearch = Boolean(filters.radiusCity && filters.radiusKm)

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const buildParams = (forCursor?: string | null) => {
    const params: Record<string, string> = {}
    if (filters.gender) params.gender = filters.gender
    if (filters.ageMin) params.ageMin = filters.ageMin
    if (filters.ageMax) params.ageMax = filters.ageMax
    if (filters.religionId) params.religionId = filters.religionId
    if (filters.casteId) params.casteId = filters.casteId
    if (filters.subcasteId) params.subcasteId = filters.subcasteId
    if (filters.motherTongue) params.motherTongue = filters.motherTongue
    if (filters.maritalStatus) params.maritalStatus = filters.maritalStatus
    if (filters.location) params.location = filters.location
    if (filters.education) params.education = filters.education
    if (filters.occupation) params.occupation = filters.occupation
    if (filters.foodPreference) params.foodPreference = filters.foodPreference
    if (filters.nakshatra) params.nakshatra = filters.nakshatra
    if (filters.rashi) params.rashi = filters.rashi
    if (filters.hasPhoto) params.hasPhoto = 'true'
    if (filters.verifiedOnly) params.verifiedOnly = 'true'
    params.sort = filters.sort

    if (isRadiusSearch) {
      const center = (cityGeo.cities as Record<string, { lat: number; lng: number }>)[filters.radiusCity]
      if (center) {
        params.centerLat = String(center.lat)
        params.centerLng = String(center.lng)
        params.radiusKm = filters.radiusKm
      }
    }
    if (forCursor) params.cursor = forCursor
    return params
  }

  const runSearch = async (append = false) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await API.get('/profiles', { params: buildParams(append ? cursor : null) })
      setProfiles((prev) => (append ? [...prev, ...data.profiles] : data.profiles))
      setCursor(data.nextCursor)
    } catch {
      setError('Could not load profiles right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Debounced re-search whenever filters change.
  useEffect(() => {
    const handle = setTimeout(() => { void runSearch(false) }, 350)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)])

  const clearAll = () => setFilters(emptyFilters)

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([k, v]) => k !== 'sort' && Boolean(v)).length,
    [filters]
  )

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl p-6 ${t.card}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-semibold ${t.cardHeading}`}>Find a Match</h2>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className={`font-mono text-[11px] uppercase tracking-[0.1em] ${t.accentText}`}>
              Clear filters ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={`mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] ${t.muted}`}>
              Gender
            </label>
            <select
              value={filters.gender}
              onChange={(e) => set('gender', e.target.value)}
              className={`w-full rounded-xl px-4 py-3 text-sm ${t.inputField}`}
            >
              <option value="">Any</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <Input label="Age (min)" type="number" min={18} max={100} value={filters.ageMin} onChange={(e) => set('ageMin', e.target.value)} />
          <Input label="Age (max)" type="number" min={18} max={100} value={filters.ageMax} onChange={(e) => set('ageMax', e.target.value)} />

          <Combobox
            label="Religion"
            value={filters.religionId}
            onChange={(v) => { set('religionId', v); set('casteId', ''); set('subcasteId', '') }}
            options={getReligions()}
            placeholder="Any religion"
          />
          <Combobox
            label="Caste"
            value={filters.casteId}
            onChange={(v) => { set('casteId', v); set('subcasteId', '') }}
            options={castes}
            disabled={!filters.religionId}
            placeholder={filters.religionId ? 'Any caste' : 'Select a religion first'}
          />
          <Combobox
            label="Subcaste"
            value={filters.subcasteId}
            onChange={(v) => set('subcasteId', v)}
            options={subcastes}
            disabled={!filters.casteId}
            placeholder={filters.casteId ? 'Any subcaste' : 'Select a caste first'}
          />

          <Input label="Mother Tongue" value={filters.motherTongue} onChange={(e) => set('motherTongue', e.target.value)} placeholder="Any" />

          <div>
            <label className={`mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] ${t.muted}`}>
              Marital Status
            </label>
            <select
              value={filters.maritalStatus}
              onChange={(e) => set('maritalStatus', e.target.value)}
              className={`w-full rounded-xl px-4 py-3 text-sm ${t.inputField}`}
            >
              <option value="">Any</option>
              <option value="Never Married">Never Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed / Widower">Widowed</option>
            </select>
          </div>

          <Input
            label="Location"
            icon={<MapPin className="h-4 w-4" />}
            value={filters.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="City or state"
          />
          <Input label="Qualification" value={filters.education} onChange={(e) => set('education', e.target.value)} placeholder="Any" />
          <Input label="Occupation" value={filters.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="Any" />

          <div>
            <label className={`mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] ${t.muted}`}>
              Food Preference
            </label>
            <select
              value={filters.foodPreference}
              onChange={(e) => set('foodPreference', e.target.value)}
              className={`w-full rounded-xl px-4 py-3 text-sm ${t.inputField}`}
            >
              <option value="">Any</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Eggetarian">Eggetarian</option>
            </select>
          </div>

          <Combobox label="Nakshatra" value={filters.nakshatra} onChange={(v) => set('nakshatra', v)} options={asOptions(NAKSHATRAS)} placeholder="Any" />
          <Combobox label="Rasi" value={filters.rashi} onChange={(v) => set('rashi', v)} options={asOptions(RASIS)} placeholder="Any" />
        </div>

        {/* Radius search — center is a known city, since real geocoding isn't wired
            up yet (see src/data/taxonomy/cityGeo.json). */}
        <div className={`mt-5 rounded-xl border ${t.border} p-4`}>
          <p className={`font-mono text-[10px] uppercase tracking-[0.1em] ${t.muted}`}>Search by distance</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Combobox
              label="Center city"
              value={filters.radiusCity}
              onChange={(v) => set('radiusCity', v)}
              options={cityOptions}
              placeholder="Choose a city"
            />
            <div>
              <label className={`mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] ${t.muted}`}>
                <span>Within</span>
                <span className={t.accentText}>{filters.radiusKm || 500} km</span>
              </label>
              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={filters.radiusKm || 500}
                disabled={!filters.radiusCity}
                onChange={(e) => set('radiusKm', e.target.value)}
                className="w-full accent-current"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <label className={`flex items-center gap-2 text-sm ${t.text}`}>
              <input type="checkbox" checked={filters.hasPhoto} onChange={(e) => set('hasPhoto', e.target.checked)} />
              Has photo
            </label>
            <label className={`flex items-center gap-2 text-sm ${t.text}`}>
              <input type="checkbox" checked={filters.verifiedOnly} onChange={(e) => set('verifiedOnly', e.target.checked)} />
              Verified profiles only
            </label>
          </div>
          <div className="w-48">
            <select
              value={filters.sort}
              onChange={(e) => set('sort', e.target.value)}
              disabled={isRadiusSearch}
              className={`w-full rounded-xl px-3 py-2 text-xs ${t.inputField}`}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
              {isRadiusSearch && <option value="distance">Distance (nearest first)</option>}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <div key={p.id} className={`rounded-2xl p-5 ${t.card}`}>
            <div className={`flex aspect-[4/5] w-full items-center justify-center rounded-xl ${t.track}`}>
              <span className={`font-cormorant text-4xl ${t.muted}`}>
                {(p.name ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <p className={`font-cormorant text-lg ${t.text}`}>{p.name ?? 'Member'}</p>
                <p className={`text-xs ${t.muted}`}>
                  {[p.age ? `${p.age} yrs` : null, p.city].filter(Boolean).join(' · ')}
                </p>
              </div>
              {(p.idVerified || p.photoVerified || p.videoVerified) && (
                <ShieldCheck className={`h-4 w-4 shrink-0 ${t.accentText}`} aria-label="Verified" />
              )}
            </div>
            <p className={`mt-2 text-xs ${t.muted}`}>{[p.religion, p.caste].filter(Boolean).join(' · ')}</p>
            {p.occupation && <p className={`mt-1 text-xs ${t.muted}`}>{p.occupation}</p>}
            {p.distanceKm != null && (
              <p className={`mt-2 font-mono text-[10px] uppercase tracking-[0.08em] ${t.accentText}`}>
                {p.distanceKm} km away
              </p>
            )}
          </div>
        ))}
      </div>

      {!loading && profiles.length === 0 && !error && (
        <div className={`rounded-2xl p-10 text-center ${t.card}`}>
          <Search className={`mx-auto h-6 w-6 ${t.muted}`} />
          <p className={`mt-3 text-sm ${t.muted}`}>No profiles match these filters yet. Try widening them.</p>
        </div>
      )}

      {cursor && !isRadiusSearch && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void runSearch(true)} disabled={loading}>
            {loading ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}

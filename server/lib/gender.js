// Single source of truth for "opposite gender" — used both by GET /api/profiles'
// mandatory server-side gender exclusivity (Panel 3.1/3.2: a member must never be
// able to pull same-gender results, even by passing a gender= query param) and by
// server/lib/matchSuggestion.js's scorer. Returns undefined for a profile with no
// gender set or a value outside Male/Female — callers must treat that as "cannot
// determine, show nothing" rather than guessing.
export function oppositeGender(gender) {
  if (gender === 'Male') return 'Female'
  if (gender === 'Female') return 'Male'
  return undefined
}

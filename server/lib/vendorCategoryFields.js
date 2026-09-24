// Category-specific dashboard shape for the vendor portal (Panel 2). The 15
// categories in VENDOR_CATS already get distinct vendorId codes (server/lib/vendorId.js);
// this groups them into 6 "dashboard families" — the categories the client's brief
// names explicitly — because two pairs of categories (Decor/Florist,
// Iyer-Purohit/Nadhaswaram-Vaathiyam) are close enough in what a booking needs to
// share one dashboard shape rather than each getting its own. This is purely a
// display/validation grouping: it doesn't touch VENDOR_CATS, SERVICE_CODES, or the
// vendorId format — a vendor's category and vendorId stay exactly as assigned.
import { VENDOR_CATS } from '../../src/data/vendorCategories.js'

/**
 * Field shapes for Catering/Photography/Venue/DJ/Iyer & Nadaswaram come directly
 * from the client brief's own examples. "Decorations & Flowers" wasn't given an
 * example there — theme/flowerType/areaSqft below is a reasonable guess, not a
 * confirmed spec; flag for confirmation before this goes to the client.
 */
export const CATEGORY_FAMILIES = {
  Catering: {
    label: 'Catering',
    categories: ['Catering'],
    fields: [
      { key: 'headcount', label: 'Guest headcount', type: 'number' },
      { key: 'menu', label: 'Menu / cuisine', type: 'text' },
    ],
  },
  Photography: {
    label: 'Photography',
    categories: ['Photography'],
    fields: [
      { key: 'hours', label: 'Coverage hours', type: 'number' },
      { key: 'packageTier', label: 'Package tier', type: 'text' },
    ],
  },
  Venue: {
    label: 'Venue / Mahal',
    categories: ['Venue'],
    fields: [
      { key: 'capacity', label: 'Guest capacity', type: 'number' },
      { key: 'hallType', label: 'Hall / Mahal type', type: 'text' },
    ],
  },
  // Guessed shape — not given an example in the brief. Confirm before shipping.
  DecorFlorist: {
    label: 'Decorations & Flowers',
    categories: ['Decor', 'Florist'],
    fields: [
      { key: 'theme', label: 'Decor theme', type: 'text' },
      { key: 'flowerType', label: 'Flower type', type: 'text' },
      { key: 'areaSqft', label: 'Area to decorate (sq. ft.)', type: 'number' },
    ],
  },
  DJ: {
    label: 'DJ',
    categories: ['DJ'],
    fields: [
      { key: 'eventDurationHours', label: 'Event duration (hours)', type: 'number' },
    ],
  },
  IyerNadaswaram: {
    label: 'Iyer & Nadaswaram',
    categories: ['Iyer/Purohit', 'Nadhaswaram-Vaathiyam'],
    fields: [
      { key: 'ceremonyType', label: 'Ceremony type', type: 'text' },
      { key: 'durationHours', label: 'Duration (hours)', type: 'number' },
    ],
  },
}

const CATEGORY_TO_FAMILY = Object.fromEntries(
  Object.entries(CATEGORY_FAMILIES).flatMap(([key, fam]) => fam.categories.map((cat) => [cat, key]))
)

const missing = VENDOR_CATS.filter((cat) => !CATEGORY_TO_FAMILY[cat])
if (missing.length && process.env.NODE_ENV !== 'production') {
  // Not fatal — plenty of the 15 categories (Invitation, Makeup, Honeymoon, Hotel,
  // Travel, Wedding Planner, Car Rental) fall outside the 6 families this task asked
  // for and simply don't get a category-specific dashboard yet.
  console.warn(`[vendorCategoryFields] categories with no dashboard family: ${missing.join(', ')}`)
}

/** Returns the dashboard family (label + field schema) for a vendor's category, or null. */
export function familyForCategory(category) {
  const key = CATEGORY_TO_FAMILY[category]
  return key ? { key, ...CATEGORY_FAMILIES[key] } : null
}

/** Strips a details payload down to only the keys this category's family defines. */
export function sanitizeDetails(category, details) {
  const family = familyForCategory(category)
  if (!family || !details || typeof details !== 'object') return {}
  const allowed = new Set(family.fields.map((f) => f.key))
  return Object.fromEntries(Object.entries(details).filter(([k]) => allowed.has(k)))
}

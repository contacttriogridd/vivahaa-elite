import { z } from 'zod'

export const steps = [
  'basic',
  'personal',
  'education',
  'family',
  'horoscope',
  'assets',
  'lifestyle',
  'preferences',
  'upload',
  'review',
] as const

export type StepKey = (typeof steps)[number]

export const MARITAL_STATUSES = [
  'Never Married',
  'Divorced',
  'Awaiting Divorce',
  'Widowed / Widower',
] as const

export const SIBLING_MARITAL_STATUSES = ['Married', 'Unmarried', 'Divorced', 'Widowed'] as const

export const ASSET_VALUE_RANGES = [
  'Under ₹10L',
  '₹10L–50L',
  '₹50L–1Cr',
  '₹1Cr+',
  'Prefer not to say',
] as const

/** Anything other than "Never Married" opens the second-marriage section. */
export const isRemarriage = (status: string) => Boolean(status) && status !== 'Never Married'
export const needsDivorceDeclaration = (status: string) =>
  status === 'Divorced' || status === 'Awaiting Divorce'
export const needsWidowDeclaration = (status: string) => status === 'Widowed / Widower'

const optionalText = z.string().trim().optional().or(z.literal(''))

const childSchema = z.object({
  age: z.string().trim().min(1, 'Enter an age'),
  livesWithMe: z.enum(['yes', 'no', 'shared']).or(z.literal('')),
})

const siblingSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  gender: z.string().trim().min(1, 'Select a gender'),
  maritalStatus: z.string().trim().min(1, 'Select a marital status'),
})

const parentSchema = z.object({
  name: z.string().trim().min(1, 'Required'),
  occupation: optionalText,
  phone: optionalText,
})

export const registerSchema = z
  .object({
    // ── basic ──────────────────────────────────────────────────────────────
    fullName: z.string().min(2, 'Name is required'),
    gender: z.string().min(1, 'Please select a gender'),
    dob: z.string().min(1, 'Date of birth is required'),
    mobile: z.string().min(10, 'Enter a valid mobile number'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number')
      .regex(/[^A-Za-z0-9]/, 'Include a symbol'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    languagePreference: z.string().min(1, 'Select preferred language'),

    // ── personal: community ────────────────────────────────────────────────
    religion: z.string().min(1, 'Select a religion'),
    caste: z.string().optional().or(z.literal('')),
    subcaste: optionalText,
    /** Kongu Vellalar Gounder only — see KonguKulamField.tsx. */
    kulam: optionalText,
    motherTongue: z.string().min(1, 'Enter your mother tongue'),

    // ── personal: marital history ──────────────────────────────────────────
    maritalStatus: z.string().min(1, 'Select marital status'),
    hasChildren: z.enum(['yes', 'no']).or(z.literal('')),
    children: z.array(childSchema),
    divorceDecreeConfirmed: z.boolean(),
    divorceDocumentName: optionalText,
    widowDeclarationConfirmed: z.boolean(),
    spousePassedOn: optionalText,

    // ── personal: physical ─────────────────────────────────────────────────
    height: z.string().min(1, 'Enter your height'),
    weight: z.string().min(1, 'Enter your weight'),
    bloodGroup: z.string().min(1, 'Enter your blood group'),

    // ── education ──────────────────────────────────────────────────────────
    qualification: z.string().min(1, 'Enter your qualification'),
    occupation: z.string().min(1, 'Enter your occupation'),
    income: z.string().min(1, 'Enter your income'),
    location: z.string().min(1, 'Enter your work location'),

    // ── family ─────────────────────────────────────────────────────────────
    father: parentSchema,
    mother: parentSchema,
    familyType: z.string().min(1, 'Enter family type'),
    hasSiblings: z.enum(['yes', 'no']).or(z.literal('')),
    siblings: z.array(siblingSchema),

    // ── horoscope ──────────────────────────────────────────────────────────
    birthTime: optionalText,
    birthPlace: optionalText,
    nakshatra: optionalText,
    rasi: optionalText,
    noHoroscopeChart: z.boolean(),

    // ── assets ─────────────────────────────────────────────────────────────
    totalAssetValue: z.string().min(1, 'Select an asset range'),

    // ── lifestyle ──────────────────────────────────────────────────────────
    foodPreference: z.string().min(1, 'Select food preference'),
    hobbies: z.string().min(1, 'Enter your hobbies'),
    interests: z.string().min(1, 'Enter your interests'),
    languages: z.string().min(1, 'Enter known languages'),

    // ── preferences ────────────────────────────────────────────────────────
    partnerAge: z.string().min(1, 'Select partner age'),
    partnerReligion: z.string().min(1, 'Select preferred religion'),
    partnerLocation: z.string().min(1, 'Enter preferred location'),

    acceptTerms: z.boolean().refine((value) => value, 'Please accept the terms'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      })
    }

    if (!isRemarriage(data.maritalStatus)) return

    if (!data.hasChildren) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hasChildren'],
        message: 'Please answer this so we can match you fairly',
      })
    }

    if (data.hasChildren === 'yes' && data.children.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['children'],
        message: 'Add at least one child',
      })
    }

    if (needsDivorceDeclaration(data.maritalStatus) && !data.divorceDecreeConfirmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['divorceDecreeConfirmed'],
        message: 'Please confirm the declaration to continue',
      })
    }

    if (needsWidowDeclaration(data.maritalStatus) && !data.widowDeclarationConfirmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['widowDeclarationConfirmed'],
        message: 'Please confirm the declaration to continue',
      })
    }
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

const emptyParent = { name: '', occupation: '', phone: '' }

export const defaultValues: RegisterFormValues = {
  fullName: '',
  gender: '',
  dob: '',
  mobile: '',
  email: '',
  password: '',
  confirmPassword: '',
  languagePreference: 'English',

  religion: '',
  caste: '',
  subcaste: '',
  kulam: '',
  motherTongue: '',

  maritalStatus: '',
  hasChildren: '',
  children: [],
  divorceDecreeConfirmed: false,
  divorceDocumentName: '',
  widowDeclarationConfirmed: false,
  spousePassedOn: '',

  height: '',
  weight: '',
  bloodGroup: '',

  qualification: '',
  occupation: '',
  income: '',
  location: '',

  father: { ...emptyParent },
  mother: { ...emptyParent },
  familyType: '',
  hasSiblings: '',
  siblings: [],

  birthTime: '',
  birthPlace: '',
  nakshatra: '',
  rasi: '',
  noHoroscopeChart: false,

  totalAssetValue: '',

  foodPreference: '',
  hobbies: '',
  interests: '',
  languages: '',

  partnerAge: '',
  partnerReligion: '',
  partnerLocation: '',

  acceptTerms: false,
}

export const stepTitles: Record<StepKey, string> = {
  basic: 'Basic Information',
  personal: 'Personal Details',
  education: 'Education & Career',
  family: 'Family Details',
  horoscope: 'Horoscope',
  assets: 'Assets',
  lifestyle: 'Lifestyle',
  preferences: 'Partner Preferences',
  upload: 'Upload Profile',
  review: 'Review & Submit',
}

export const stepDescriptions: Record<StepKey, string> = {
  basic: 'Create your trusted identity',
  personal: 'Share the details that shape your profile',
  education: 'Highlight your education and career',
  family: 'Let families feel confident about your background',
  horoscope: 'Birth details, for those who match by horoscope',
  assets: 'One question, and only a broad range',
  lifestyle: 'Share your daily rhythm and interests',
  preferences: 'Tell us who would be a great match',
  upload: 'Add your photos and verification documents',
  review: 'Inspect your profile before submitting',
}

type FieldName = keyof RegisterFormValues

/**
 * Fields validated when leaving each step, so a user is corrected where the field
 * is rather than at submit time, six steps later. Conditional sub-sections are
 * covered by the schema's superRefine and surface on their parent step.
 */
export const stepFields: Record<StepKey, FieldName[]> = {
  basic: [
    'fullName',
    'gender',
    'dob',
    'mobile',
    'email',
    'password',
    'confirmPassword',
    'languagePreference',
  ],
  personal: [
    'religion',
    'motherTongue',
    'maritalStatus',
    'hasChildren',
    'children',
    'divorceDecreeConfirmed',
    'widowDeclarationConfirmed',
    'height',
    'weight',
    'bloodGroup',
  ],
  education: ['qualification', 'occupation', 'income', 'location'],
  family: ['father', 'mother', 'familyType', 'siblings'],
  horoscope: [],
  assets: ['totalAssetValue'],
  lifestyle: ['foodPreference', 'hobbies', 'interests', 'languages'],
  preferences: ['partnerAge', 'partnerReligion', 'partnerLocation'],
  upload: [],
  review: ['acceptTerms'],
}

/**
 * Fields that must never reach a public profile view without an explicit opt-in.
 * The submit payload nests these under `private` so the boundary is visible in the
 * request body itself and cannot be lost by a careless spread on the server.
 */
export const PRIVATE_BY_DEFAULT = [
  'maritalStatus',
  'hasChildren',
  'children',
  'divorceDecreeConfirmed',
  'divorceDocumentName',
  'widowDeclarationConfirmed',
  'spousePassedOn',
  'father.phone',
  'mother.phone',
  'totalAssetValue',
] as const

import { z } from 'zod'

/**
 * 5-step layout (rebuilt from the original 10 steps — see the registration rebuild
 * plan). No field was dropped in the compression; steps without an exact row in the
 * spec's step table (horoscope, lifestyle) were folded into the nearest personal/
 * background step rather than silently discarded — see RegistrationWizard.tsx's step
 * components for where each landed.
 */
export const steps = [
  'basicContact',
  'communityBackground',
  'educationCareerFamily',
  'assetsPhotosPartner',
  'membershipPayment',
] as const

export type StepKey = (typeof steps)[number]

export const MARITAL_STATUSES = [
  'Never Married',
  'Divorced',
  'Awaiting Divorce',
  'Widowed / Widower',
] as const

export const SIBLING_MARITAL_STATUSES = ['Married', 'Unmarried', 'Divorced', 'Widowed'] as const

export const COMPLEXIONS = ['Fair', 'Wheatish', 'Wheatish Brown', 'Dusky', 'Dark'] as const

/**
 * Nine non-overlapping brackets, replacing the original five lakh-denominated ranges.
 * Mirrored server-side at server/lib/registrationValidation.js's ASSET_VALUE_RANGES —
 * keep both in sync.
 */
export const ASSET_VALUE_RANGES = [
  'Below ₹1 Cr',
  '₹1 Cr – ₹5 Cr',
  '₹5 Cr – ₹10 Cr',
  '₹10 Cr – ₹20 Cr',
  '₹20 Cr – ₹50 Cr',
  '₹50 Cr – ₹100 Cr',
  '₹100 Cr – ₹200 Cr',
  '₹200 Cr – ₹500 Cr',
  'Above ₹500 Cr',
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
    // ── Step 1: Basic & Contact Details ──────────────────────────────────────
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
    location: z.string().min(1, 'Enter your city'),
    maritalStatus: z.string().min(1, 'Select marital status'),

    // ── Step 2: Religion, Community & Personal Background ────────────────────
    religion: z.string().min(1, 'Select a religion'),
    caste: z.string().optional().or(z.literal('')),
    subcaste: optionalText,
    /** Kongu Vellalar Gounder only — see KonguKulamField.tsx. */
    kulam: optionalText,
    motherTongue: z.string().min(1, 'Enter your mother tongue'),

    hasChildren: z.enum(['yes', 'no']).or(z.literal('')),
    children: z.array(childSchema),
    divorceDecreeConfirmed: z.boolean(),
    divorceDocumentName: optionalText,
    widowDeclarationConfirmed: z.boolean(),
    spousePassedOn: optionalText,

    height: z.string().min(1, 'Enter your height'),
    weight: z.string().min(1, 'Enter your weight'),
    bloodGroup: z.string().min(1, 'Enter your blood group'),
    complexion: optionalText,
    disabilityStatus: optionalText,

    birthTime: optionalText,
    birthPlace: optionalText,
    nakshatra: optionalText,
    rasi: optionalText,
    noHoroscopeChart: z.boolean(),

    // ── Step 3: Education, Career & Family ────────────────────────────────────
    qualification: z.string().min(1, 'Enter your qualification'),
    occupation: z.string().min(1, 'Enter your occupation'),
    income: z.string().min(1, 'Enter your income'),

    father: parentSchema,
    mother: parentSchema,
    familyType: z.string().min(1, 'Enter family type'),
    hasSiblings: z.enum(['yes', 'no']).or(z.literal('')),
    siblings: z.array(siblingSchema),

    foodPreference: z.string().min(1, 'Select food preference'),
    hobbies: z.string().min(1, 'Enter your hobbies'),
    interests: z.string().min(1, 'Enter your interests'),
    languages: z.string().min(1, 'Enter known languages'),

    // ── Step 4: Assets, Photos & Partner Preferences ──────────────────────────
    totalAssetValue: z.string().min(1, 'Select an asset range'),
    photoDataUrl: optionalText,

    partnerAge: z.string().min(1, 'Select partner age'),
    partnerReligion: z.string().min(1, 'Select preferred religion'),
    partnerLocation: z.string().min(1, 'Enter preferred location'),

    // ── Step 5: Membership, Payment & Review ──────────────────────────────────
    selectedPlan: z.string().min(1, 'Choose a membership package'),
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
  location: '',
  maritalStatus: '',

  religion: '',
  caste: '',
  subcaste: '',
  kulam: '',
  motherTongue: '',

  hasChildren: '',
  children: [],
  divorceDecreeConfirmed: false,
  divorceDocumentName: '',
  widowDeclarationConfirmed: false,
  spousePassedOn: '',

  height: '',
  weight: '',
  bloodGroup: '',
  complexion: '',
  disabilityStatus: '',

  birthTime: '',
  birthPlace: '',
  nakshatra: '',
  rasi: '',
  noHoroscopeChart: false,

  qualification: '',
  occupation: '',
  income: '',

  father: { ...emptyParent },
  mother: { ...emptyParent },
  familyType: '',
  hasSiblings: '',
  siblings: [],

  foodPreference: '',
  hobbies: '',
  interests: '',
  languages: '',

  totalAssetValue: '',
  photoDataUrl: '',

  partnerAge: '',
  partnerReligion: '',
  partnerLocation: '',

  selectedPlan: '',
  acceptTerms: false,
}

export const stepTitles: Record<StepKey, string> = {
  basicContact: 'Basic & Contact Details',
  communityBackground: 'Religion, Community & Background',
  educationCareerFamily: 'Education, Career & Family',
  assetsPhotosPartner: 'Assets, Photos & Preferences',
  membershipPayment: 'Membership & Payment',
}

export const stepDescriptions: Record<StepKey, string> = {
  basicContact: 'Create your trusted identity',
  communityBackground: 'Community, physical profile, and horoscope',
  educationCareerFamily: 'Career, lifestyle, and family background',
  assetsPhotosPartner: 'Asset range, photo, and who you’re looking for',
  membershipPayment: 'Choose your package and complete payment',
}

type FieldName = keyof RegisterFormValues

/**
 * Fields validated when leaving each step, so a user is corrected where the field
 * is rather than at submit time. Conditional sub-sections are covered by the schema's
 * superRefine and surface on their parent step.
 */
export const stepFields: Record<StepKey, FieldName[]> = {
  basicContact: [
    'fullName',
    'gender',
    'dob',
    'mobile',
    'email',
    'password',
    'confirmPassword',
    'languagePreference',
    'location',
    'maritalStatus',
    'hasChildren',
    'children',
    'divorceDecreeConfirmed',
    'widowDeclarationConfirmed',
  ],
  communityBackground: ['religion', 'motherTongue', 'height', 'weight', 'bloodGroup'],
  educationCareerFamily: [
    'qualification',
    'occupation',
    'income',
    'father',
    'mother',
    'familyType',
    'siblings',
    'foodPreference',
    'hobbies',
    'interests',
    'languages',
  ],
  assetsPhotosPartner: ['totalAssetValue', 'partnerAge', 'partnerReligion', 'partnerLocation'],
  membershipPayment: ['selectedPlan', 'acceptTerms'],
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

// Coarse income-bracket options for the Elite-only income filter — see
// User.incomeBracket's doc comment in prisma/schema.prisma for why this is a
// separate exact-match field from the free-text `income` the registration wizard
// captures. Plain .js (not .ts) so server/index.js can import it directly without
// crossing into TypeScript source (see server/lib/vendorId.js's comment for why that
// breaks Vercel's serverless bundler).
export const INCOME_BRACKETS = ['Below 5 LPA', '5-10 LPA', '10-20 LPA', '20-50 LPA', '50 LPA+']

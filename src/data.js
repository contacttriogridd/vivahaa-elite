// ── Design tokens ──────────────────────────────────────────────────────────
export const STD = {
  bg: '#FBF7F0', panel: '#F3ECDF', primary: '#7A2436',
  gold: '#C6982F', text: '#2B2521', border: '#E5DAC5', muted: '#8B7355',
}
export const ELITE = {
  bg: '#0B0A09', panel: '#17130F', primary: '#5C1A27',
  gold: '#D9B24C', text: '#F3E9D2', border: '#3A311F', muted: '#8A7A5A',
}
export const ADMIN = {
  bg: '#080810', sidebar: '#0D0D1A', panel: '#12121F',
  card: '#16162A', border: '#1E1E35', borderGlow: '#2A2A50',
  gold: '#D9B24C', goldGlow: '#D9B24C33',
  primary: '#7A2436', primaryGlow: '#7A243633',
  text: '#F0EEF8', muted: '#6B6B8A', subtle: '#3A3A5C',
  green: '#22C55E', red: '#EF4444', blue: '#3B82F6', purple: '#A855F7',
  orange: '#F97316', cyan: '#06B6D4',
  gradient: 'linear-gradient(135deg, #D9B24C 0%, #F5D98B 50%, #D9B24C 100%)',
  gradientCard: 'linear-gradient(135deg, #16162A 0%, #1E1E35 100%)',
}

// Re-exported from src/lib/plans.ts, the single source of truth for pricing/benefits.
// Kept in this exact shape (id/name/price/duration/features) so every legacy .jsx
// file that already imports PLANS from here — Dealer.jsx's plan dropdown, etc. —
// keeps working unchanged.
import { PLANS as PLAN_SOURCE } from './lib/plans.ts'
export const PLANS = {
  standard: PLAN_SOURCE.standard.map(({ id, name, price, duration, features }) => ({ id, name, price, duration, features })),
  elite: PLAN_SOURCE.elite.map(({ id, name, price, duration, features }) => ({ id, name, price, duration, features })),
}

export const CITIES = ['Coimbatore','Tirupur','Erode','Namakkal','Salem','Dindigul']
export const VENDOR_CATS = ['Invitation','Venue','Catering','Photography','Decor','Makeup','Honeymoon',
  'Iyer/Purohit','Nadhaswaram-Vaathiyam','Hotel','Travel','Wedding Planner','DJ','Car Rental','Florist']
export const SHARED_CATS = ['Iyer/Purohit','Nadhaswaram-Vaathiyam']
export const NAKSHATRAS = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu',
  'Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha',
  'Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati']
export const RASHIS = ['Mesha','Vrishabha','Mithuna','Kataka','Simha','Kanya',
  'Tula','Vrischika','Dhanus','Makara','Kumbha','Meena']

const NAMES_M = ['Aravind','Karthik','Suresh','Vijay','Ravi','Anand','Murugan','Senthil','Ganesh','Praveen',
  'Deepak','Harish','Sathish','Rajesh','Venkat','Balaji','Dinesh','Manoj','Naveen','Pradeep']
const NAMES_F = ['Priya','Deepa','Kavitha','Meena','Anitha','Lakshmi','Divya','Nithya','Sowmya','Revathi',
  'Saranya','Pavithra','Keerthana','Aishwarya','Bhavani','Geetha','Hema','Indira','Janani','Kamala']
const OCCS = ['Software Engineer','Doctor','CA','MBA','Teacher','Lawyer','Architect','Banker','IAS Officer','Entrepreneur']
const EDUS = ['B.Tech','MBBS','CA','MBA','M.Tech','B.Sc','B.Com','PhD','B.A','Diploma']
const CASTES = ['Iyer','Iyengar','Mudaliar','Pillai','Nadar','Gounder','Chettiar','Vellalar','Naicker','Reddiar']

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randDate = (start, end) => {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString().split('T')[0]
}

const genUsers = () => {
  const users = []
  const tiers = ['standard','standard','standard','elite','elite']
  const plans = { standard: ['silver','gold','diamond'], elite: ['platinum','platinumplus'] }
  const statuses = ['paid','paid','paid','paid','pending']
  const approvals = [true,true,true,false,false]

  for (let i = 1; i <= 48; i++) {
    const gender = i % 2 === 0 ? 'Female' : 'Male'
    const names = gender === 'Male' ? NAMES_M : NAMES_F
    const name = `${rand(names)} ${rand(['Kumar','Sharma','Iyer','Pillai','Rajan','Nair','Menon','Reddy','Rao','Krishnan'])}`
    const tier = rand(tiers)
    const plan = rand(plans[tier])
    const feeStatus = rand(statuses)
    const approved = feeStatus === 'paid' ? rand(approvals) : false
    const city = rand(CITIES)
    const dob = randDate(new Date(1988,0,1), new Date(2000,0,1))
    const age = new Date().getFullYear() - new Date(dob).getFullYear()
    const income = randInt(4,40) * 100000

    users.push({
      id: `u${i}`, name, email: `user${i}@demo.com`, phone: `98765${String(43200+i).padStart(5,'0')}`,
      gender, dob, age, religion: 'Hindu', caste: rand(CASTES),
      city, education: rand(EDUS), occupation: rand(OCCS),
      income: income.toLocaleString('en-IN'),
      tier, plan, fee_status: feeStatus, approved,
      dealerCode: i % 5 === 0 ? 'DEAL01' : i % 7 === 0 ? 'DEAL02' : '',
      nakshatra: rand(NAKSHATRAS), rashi: rand(RASHIS),
      birthTime: `${randInt(0,23).toString().padStart(2,'0')}:${randInt(0,59).toString().padStart(2,'0')}`,
      birthPlace: city,
      height: `${randInt(155,185)} cm`, weight: `${randInt(50,85)} kg`,
      bloodGroup: rand(['A+','B+','O+','AB+','A-','B-','O-']),
      dosham: rand(['None','Chevvai','Rahu','Kethu']),
      maritalStatus: rand(['Never Married','Divorced','Widowed']),
      assets: {
        property: `${randInt(10,200)},00,000`,
        vehicle: `${randInt(3,25)},00,000`,
        savings: `${randInt(5,50)},00,000`,
      },
      hobbies: [rand(['Reading','Cricket','Music','Travel','Yoga','Cooking','Chess','Photography'])],
      partnerExpectation: 'Educated, family-oriented, good values',
      siblings: [],
      photo: null, chartPhoto: null,
      interests: [], coupons: [],
      profileCompletion: randInt(60,100),
      accountHealth: rand(['Excellent','Good','Fair','Poor']),
      lastLogin: new Date(Date.now() - randInt(0,30)*86400000).toISOString(),
      registeredAt: new Date(Date.now() - randInt(1,365)*86400000).toISOString(),
      status: approved ? rand(['active','active','active','suspended']) : 'pending',
      adminNotes: '',
      loginHistory: Array.from({length: randInt(2,8)}, (_, j) => ({
        ts: new Date(Date.now() - j*randInt(1,5)*86400000).toISOString(),
        ip: `192.168.${randInt(1,255)}.${randInt(1,255)}`,
        device: rand(['Chrome/Windows','Safari/iOS','Firefox/Mac','Chrome/Android']),
      })),
      paymentHistory: feeStatus === 'paid' ? [{
        id: `PAY${i}`, amount: PLANS[tier].find(p=>p.id===plan)?.price || 699,
        date: new Date(Date.now() - randInt(1,60)*86400000).toISOString(),
        method: rand(['UPI','Card','NetBanking']), status: 'success',
      }] : [],
    })
  }
  // Add the 3 original demo users at the front
  users.unshift(
    { id:'u_anand', name:'Anand Kumar', email:'anand@demo.com', phone:'9876543210',
      gender:'Male', dob:'1995-06-15', age:29, religion:'Hindu', caste:'Iyer',
      city:'Coimbatore', education:'B.Tech', occupation:'Software Engineer',
      income:'12,00,000', tier:'standard', plan:'gold', fee_status:'paid', approved:true,
      dealerCode:'', nakshatra:'Rohini', rashi:'Vrishabha', birthTime:'06:30', birthPlace:'Coimbatore',
      height:'175 cm', weight:'70 kg', bloodGroup:'O+', dosham:'None', maritalStatus:'Never Married',
      assets:{property:'50,00,000',vehicle:'8,00,000',savings:'15,00,000'},
      hobbies:['Reading','Cricket','Cooking'], partnerExpectation:'Educated, family-oriented',
      siblings:[{name:'Anitha',gender:'Female',status:'Married'}],
      photo:null, chartPhoto:null, interests:[], coupons:[],
      profileCompletion:92, accountHealth:'Excellent', status:'active',
      lastLogin:new Date().toISOString(), registeredAt:'2024-01-15T10:00:00Z',
      adminNotes:'', loginHistory:[], paymentHistory:[{id:'PAY_A1',amount:699,date:'2024-01-15T10:00:00Z',method:'UPI',status:'success'}],
    },
    { id:'u_priya', name:'Priya Sharma', email:'priya@demo.com', phone:'9876543211',
      gender:'Female', dob:'1997-03-22', age:27, religion:'Hindu', caste:'Iyer',
      city:'Salem', education:'MBA', occupation:'HR Manager',
      income:'8,00,000', tier:'elite', plan:'platinum', fee_status:'paid', approved:true,
      dealerCode:'DEAL01', nakshatra:'Ashwini', rashi:'Mesha', birthTime:'10:15', birthPlace:'Salem',
      height:'162 cm', weight:'55 kg', bloodGroup:'B+', dosham:'Chevvai', maritalStatus:'Never Married',
      assets:{property:'30,00,000',vehicle:'5,00,000',savings:'10,00,000'},
      hobbies:['Music','Travel','Yoga'], partnerExpectation:'Well-settled, caring',
      siblings:[], photo:null, chartPhoto:null, interests:[], coupons:[],
      profileCompletion:88, accountHealth:'Good', status:'active',
      lastLogin:new Date().toISOString(), registeredAt:'2024-02-10T09:00:00Z',
      adminNotes:'VIP member', loginHistory:[], paymentHistory:[{id:'PAY_P1',amount:1499,date:'2024-02-10T09:00:00Z',method:'Card',status:'success'}],
    },
    { id:'u_ravi', name:'Ravi Iyer', email:'ravi@demo.com', phone:'9876543212',
      gender:'Male', dob:'1993-11-08', age:31, religion:'Hindu', caste:'Iyer',
      city:'Erode', education:'CA', occupation:'Chartered Accountant',
      income:'18,00,000', tier:'standard', plan:'diamond', fee_status:'pending', approved:false,
      dealerCode:'', nakshatra:'Krittika', rashi:'Vrishabha', birthTime:'14:45', birthPlace:'Erode',
      height:'178 cm', weight:'75 kg', bloodGroup:'A+', dosham:'None', maritalStatus:'Never Married',
      assets:{property:'80,00,000',vehicle:'12,00,000',savings:'25,00,000'},
      hobbies:['Chess','Carnatic Music'], partnerExpectation:'Traditional, educated',
      siblings:[{name:'Ramya',gender:'Female',status:'Unmarried'},{name:'Rajesh',gender:'Male',status:'Married'}],
      photo:null, chartPhoto:null, interests:[], coupons:[],
      profileCompletion:75, accountHealth:'Fair', status:'pending',
      lastLogin:'2024-11-01T08:00:00Z', registeredAt:'2024-10-20T11:00:00Z',
      adminNotes:'', loginHistory:[], paymentHistory:[],
    }
  )
  return users
}

const genDealers = () => [
  { id:'d1', name:'Murugan Agencies', email:'dealer@demo.com', phone:'9876500001',
    code:'DEAL01', city:'Salem', status:'active', verified:true,
    commissionPct:8, totalEarned:24800, pendingCommission:3200,
    members:[], joinedAt:'2024-01-01T00:00:00Z',
    monthlyRevenue:[12000,18000,15000,22000,19000,28000,24000,31000,27000,35000,29000,38000],
    documents:['GST Certificate','Aadhaar','PAN'],
    loginHistory:[{ts:new Date().toISOString(),ip:'103.21.45.12',device:'Chrome/Windows'}],
  },
  { id:'d2', name:'Lakshmi Matrimony Services', email:'dealer2@demo.com', phone:'9876500002',
    code:'DEAL02', city:'Coimbatore', status:'active', verified:true,
    commissionPct:10, totalEarned:41200, pendingCommission:5600,
    members:[], joinedAt:'2024-02-15T00:00:00Z',
    monthlyRevenue:[8000,12000,18000,15000,24000,20000,28000,25000,32000,29000,36000,42000],
    documents:['GST Certificate','Aadhaar'],
    loginHistory:[{ts:new Date().toISOString(),ip:'103.22.46.13',device:'Safari/iOS'}],
  },
  { id:'d3', name:'Thiruvenkatam Matches', email:'dealer3@demo.com', phone:'9876500003',
    code:'DEAL03', city:'Erode', status:'suspended', verified:false,
    commissionPct:7, totalEarned:9400, pendingCommission:1200,
    members:[], joinedAt:'2024-05-01T00:00:00Z',
    monthlyRevenue:[3000,5000,4000,6000,5000,7000,6000,8000,7000,9000,8000,10000],
    documents:['Aadhaar'],
    loginHistory:[],
  },
]

const genVendors = () => {
  const v = []
  let id = 1
  CITIES.forEach(city => {
    VENDOR_CATS.forEach(cat => {
      ['standard','elite'].forEach(tier => {
        v.push({
          id: `v${id++}`, city, category: cat, tier,
          name: `${city} ${cat} ${tier==='elite'?'Prestige':'Services'}`,
          contact: `+91 98${String(id).padStart(8,'4')}`,
          email: `vendor${id}@demo.com`,
          price: tier==='elite' ? `₹${(id%5+3)*10000}+` : `₹${(id%5+1)*5000}+`,
          priceNum: tier==='elite' ? (id%5+3)*10000 : (id%5+1)*5000,
          rating: parseFloat((3.5+(id%15)/10).toFixed(1)),
          reviews: randInt(5,120),
          bookings: randInt(2,50),
          status: rand(['active','active','active','suspended']),
          verified: rand([true,true,false]),
          commissionPct: randInt(5,15),
          monthlyRevenue: randInt(20000,200000),
          gst: `29ABCDE${randInt(1000,9999)}F1Z5`,
          address: `${randInt(1,200)}, Main Street, ${city}`,
          gallery: [],
          joinedAt: new Date(Date.now()-randInt(30,500)*86400000).toISOString(),
        })
      })
    })
  })
  return v
}

const genMonthlyRevenue = () => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return months.map((month, i) => ({
    month,
    standard: randInt(80000,180000),
    elite: randInt(120000,320000),
    dealer: randInt(15000,45000),
    vendor: randInt(10000,35000),
    total: 0,
  })).map(r => ({ ...r, total: r.standard + r.elite + r.dealer + r.vendor }))
}

const genGifts = () => [
  { id:'g1', type:'standard', name:'Gift Hamper', description:'Curated wedding gift hamper', value:2500, stock:45, dispatched:12, status:'active' },
  { id:'g2', type:'standard', name:'Personalized Greeting Card', description:'Custom printed card', value:200, stock:200, dispatched:38, status:'active' },
  { id:'g3', type:'standard', name:'Couple Certificate', description:'Vivahaa Elite marriage certificate', value:500, stock:100, dispatched:15, status:'active' },
  { id:'g4', type:'standard', name:'Flower Bouquet', description:'Fresh flower arrangement', value:800, stock:30, dispatched:8, status:'active' },
  { id:'g5', type:'elite', name:'Luxury Couple Watch Set', description:'Premium branded watch set', value:25000, stock:10, dispatched:3, status:'active' },
  { id:'g6', type:'elite', name:'Premium Leather Album', description:'150-200 photo luxury album', value:8000, stock:15, dispatched:5, status:'active' },
  { id:'g7', type:'elite', name:'Premium Wall Frame', description:'Custom couple portrait frame', value:3500, stock:20, dispatched:4, status:'active' },
  { id:'g8', type:'elite', name:'Luxury Silver Gift', description:'925 silver blessing set', value:12000, stock:8, dispatched:2, status:'active' },
  { id:'g9', type:'elite', name:'Premium Honeymoon Voucher', description:'5-star resort voucher', value:50000, stock:5, dispatched:1, status:'active' },
  { id:'g10', type:'elite', name:'Luxury Home Decor Gift', description:'Premium home decor collection', value:15000, stock:12, dispatched:3, status:'active' },
]

const genSuccessStories = () => [
  { id:'s1', names:'Aravind & Priya', city:'Coimbatore', tier:'standard', year:2024, story:'Met through Vivahaa Gold. Matched on 8/10 poruthams. Married in 3 months!', giftDispatched:true, giftType:'standard' },
  { id:'s2', names:'Karthik & Deepa', city:'Salem', tier:'elite', year:2024, story:'Platinum Plus concierge introduced us. Dream wedding at Ooty.', giftDispatched:true, giftType:'elite' },
  { id:'s3', names:'Suresh & Kavitha', city:'Erode', tier:'standard', year:2023, story:'Diamond plan horoscope match was spot on. Happily settled in Erode.', giftDispatched:false, giftType:'standard' },
  { id:'s4', names:'Vijay & Meena', city:'Tirupur', tier:'elite', year:2024, story:'Personal matchmaker found the perfect match. Blessed union!', giftDispatched:true, giftType:'elite' },
  { id:'s5', names:'Senthil & Nithya', city:'Namakkal', tier:'standard', year:2024, story:'Found each other through horoscope matching. Perfect compatibility!', giftDispatched:false, giftType:'standard' },
  { id:'s6', names:'Ganesh & Sowmya', city:'Dindigul', tier:'elite', year:2023, story:'Platinum concierge service made our match seamless. Forever grateful!', giftDispatched:true, giftType:'elite' },
]

const genAuditLog = () => {
  const actions = ['approve_user','reject_user','suspend_user','activate_user','edit_user',
    'approve_vendor','suspend_vendor','edit_package','add_dealer','remove_dealer',
    'dispatch_gift','generate_report','login','logout','bulk_export']
  return Array.from({length:40}, (_, i) => ({
    id: `log${i+1}`,
    action: rand(actions),
    entity: rand(['User','Dealer','Vendor','Package','Gift','Report']),
    entityId: `${rand(['u','d','v','p','g'])}${randInt(1,20)}`,
    adminId: 'admin',
    ip: `103.${randInt(1,255)}.${randInt(1,255)}.${randInt(1,255)}`,
    ts: new Date(Date.now()-i*randInt(1,8)*3600000).toISOString(),
    details: `Action performed on entity`,
  }))
}

// ── Mutable global state ────────────────────────────────────────────────────
export const state = {
  users: genUsers(),
  dealers: genDealers(),
  vendors: genVendors(),
  gifts: genGifts(),
  packages: [...PLANS.standard, ...PLANS.elite],
  successStories: genSuccessStories(),
  monthlyRevenue: genMonthlyRevenue(),
  adminLog: genAuditLog(),
  currentUser: null,
  currentDealer: null,
  isAdmin: false,
}

// Wire dealer members after users are generated
state.dealers[0].members = state.users.filter(u=>u.dealerCode==='DEAL01').map(u=>u.id)
state.dealers[1].members = state.users.filter(u=>u.dealerCode==='DEAL02').map(u=>u.id)
state.dealers[2].members = state.users.filter(u=>u.dealerCode==='DEAL03').map(u=>u.id)

export const SUCCESS_STORIES = state.successStories

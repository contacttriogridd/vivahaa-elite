import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Mail, Lock, Eye, EyeOff, LogIn, Shield, Sparkles, Heart, ChevronRight,
  Globe, Moon, Sun, HelpCircle, HeadphonesIcon, Bot, Quote, Send,
  XCircle, ShieldCheck, Bell, Fingerprint, Smartphone, Apple, Chrome,
  Key, Clock, CheckCircle2, Crown, Gift, Activity
} from 'lucide-react'
import Confetti from 'react-confetti'
import { loginSchema } from '../lib/validations'
import type { LoginFormData, DailyQuote, TrustBadge, StatItem } from '../types'
import type { PasswordStrength } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { GlassCard } from '../components/ui/card'
import API from '../lib/api'
import i18n from '../lib/i18n'

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1587271636175-90d58cdad458?w=1920&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1920&q=80',
  'https://images.unsplash.com/photo-1465495976272-6807e67e8e64?w=1920&q=80',
  'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=1920&q=80',
]

const DAILY_QUOTES: DailyQuote[] = [
  { text: "A successful marriage requires falling in love many times, always with the same person.", author: "Mignon McLaughlin" },
  { text: "The secret of a happy marriage is finding the right person.", author: "Julia Child" },
  { text: "Love is not about how many days you've been together. Love is about how much you love each other every single day.", author: "Unknown" },
  { text: "A great marriage is when an imperfect couple learns to enjoy their differences.", author: "Dave Meurer" },
  { text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
  { text: "A happy marriage is a long conversation that always seems too short.", author: "Andre Maurois" },
]

const TRUST_BADGES: TrustBadge[] = [
  { icon: ShieldCheck, label: "100% Verified Profiles", color: "text-green-400" },
  { icon: Sparkles, label: "AI Matchmaking", color: "text-amber-400" },
  { icon: Heart, label: "Premium Security", color: "text-rose-400" },
]

const STATS: StatItem[] = [
  { value: '12,400+', label: 'Verified Members' },
  { value: '3,200+', label: 'Success Stories' },
  { value: '98%', label: 'Satisfaction' },
]

const AI_MENU_ITEMS = [
  { label: 'Compatibility Preview', icon: Heart, desc: 'AI-powered match analysis' },
  { label: 'AI Match Prediction', icon: Sparkles, desc: 'Predict relationship success' },
  { label: 'Relationship Tips', icon: ChevronRight, desc: 'Expert guidance & advice' },
  { label: 'Marriage Guidance', icon: Crown, desc: 'Premium counseling support' },
]

const PASSWORD_STRENGTHS: PasswordStrength[] = [
  { level: 0, label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-400' },
  { level: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-400' },
  { level: 2, label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { level: 3, label: 'Strong', color: 'bg-green-500', textColor: 'text-green-400' },
  { level: 4, label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
]

function getPasswordStrength(password: string): PasswordStrength & { level: number } {
  if (!password) return { level: 0, label: '', color: 'bg-elite-border', textColor: 'text-elite-muted' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4
  return { ...PASSWORD_STRENGTHS[clamped], level: clamped }
}

function getGreetingLabel() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

export default function PremiumLogin() {
  const { t } = useTranslation()
  const { login, loginWithGoogle, loading: authLoading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [bgIndex, setBgIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAI, setShowAI] = useState(false)
  const [quote, setQuote] = useState(DAILY_QUOTES[0])
  const [langOpen, setLangOpen] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email')
  const [newPassword, setNewPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isForgotLoading, setIsForgotLoading] = useState(false)
  const [isOtpLoading, setIsOtpLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState<'admin' | 'user' | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })
  const emailFieldProps = register('email')
  const passwordFieldProps = register('password')

  const password = watch('password', '')
  const emailValue = watch('email', '')
  const pwdStrength = getPasswordStrength(password)
  const isPasswordValid = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
  const greetingLabel = getGreetingLabel()

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const bgInterval = setInterval(() => setBgIndex(i => (i + 1) % BG_IMAGES.length), 15000)
    const quoteInterval = setInterval(() => setQuote(DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)]), 30000)
    return () => { clearInterval(bgInterval); clearInterval(quoteInterval) }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => setCapsLock(e.getModifierState('CapsLock')), [])
  const handleKeyUp = useCallback((e: React.KeyboardEvent) => setCapsLock(e.getModifierState('CapsLock')), [])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true); setError(''); setSuccessMessage('')
    try {
      await login(data.email, data.password, data.rememberMe)
      setLoginSuccess(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    } catch (err: any) {
      setError(err.response?.data?.message || t('login.invalidCredentials'))
    } finally { setIsLoading(false) }
  }

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true); setError(''); setSuccessMessage('')
    loginWithGoogle()
  }

  const handleDemoLogin = async (role: 'admin' | 'user') => {
    setIsDemoLoading(role); setError(''); setSuccessMessage('')
    try {
      const demoEmail = role === 'admin' ? 'admin@vivahaaelite.demo' : 'demo@vivahaaelite.demo'
      const demoPassword = role === 'admin' ? 'Admin@123' : 'Demo@123'
      await login(demoEmail, demoPassword, true)
      setLoginSuccess(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    } catch (err: any) {
      setError(err.response?.data?.message || t('login.invalidCredentials'))
    } finally { setIsDemoLoading(null) }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) return
    setIsForgotLoading(true); setError(''); setSuccessMessage('')
    try {
      const { data } = await API.post('/auth/forgot-password', { email: forgotEmail })
      setOtpSent(true)
      setResetStep('otp')
      setSuccessMessage(data.message || t('forgotPassword.emailSent'))
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    } finally { setIsForgotLoading(false) }
  }

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) return
    setIsOtpLoading(true); setError(''); setSuccessMessage('')
    try {
      const { data } = await API.post('/auth/verify-otp', { email: forgotEmail, otp: otpValue })
      setResetToken(data.token)
      setResetStep('password')
      setSuccessMessage(t('otp.verified'))
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    } finally { setIsOtpLoading(false) }
  }

  const handleResetPassword = async () => {
    if (!resetToken || !newPassword) return
    setIsResetLoading(true); setError(''); setSuccessMessage('')
    try {
      await API.post('/auth/reset-password', { token: resetToken, password: newPassword })
      setShowForgotPassword(false)
      setResetStep('email')
      setOtpSent(false)
      setOtpValue('')
      setNewPassword('')
      setResetToken('')
      setSuccessMessage(t('forgotPassword.resetSuccess'))
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'))
    } finally { setIsResetLoading(false) }
  }

  const particleAnimation = {
    y: [0, -30, 0],
    opacity: [0.2, 0.8, 0.2],
  }

  const petalAnimation = {
    y: [0, -120],
    x: [0, 60, -60, 0],
    opacity: [0, 0.6, 0],
    rotate: [0, 360],
  }

  if (loginSuccess) {
    return (
      <div className="relative min-h-screen bg-elite-bg overflow-hidden">
        {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} colors={['#D4AF37', '#7B1E2B', '#FFF8F0', '#FFD700']} />}
        <div className="relative z-30 flex items-center justify-between px-6 py-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Heart className="w-5 h-5 text-elite-bg" />
            </div>
            <div>
              <h1 className="font-playfair text-lg font-bold text-royal-gold">Vivahaa Elite</h1>
              <p className="font-mono text-[9px] tracking-[0.2em] text-elite-muted uppercase">Premium Matrimony</p>
            </div>
          </motion.div>
        </div>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 20 }} className="text-center max-w-lg">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-24 h-24 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-elite-bg" />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="font-playfair text-3xl font-bold text-elite-text mb-3">
              {t('login.welcomeBack')}
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="font-cormorant text-lg text-elite-muted mb-8 italic">
              Let us help you find your perfect match
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 gap-4 mb-8">
              {[
                { label: 'Profile Completion', value: '45%', icon: Activity, color: 'text-amber-400' },
                { label: 'Recent Visitors', value: '12', icon: Eye, color: 'text-blue-400' },
                { label: 'New Matches', value: '3', icon: Heart, color: 'text-rose-400' },
                { label: 'Messages', value: '5', icon: Mail, color: 'text-green-400' },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ scale: 1.02 }} className="glass-card dark:glass-card-dark p-4 rounded-xl text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="font-mono text-[9px] tracking-wider text-elite-muted uppercase">{item.label}</span>
                  </div>
                  <p className="font-playfair text-2xl font-bold text-royal-gold">{item.value}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="glass-card dark:glass-card-dark p-6 rounded-xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-royal-gold" />
                <span className="font-mono text-[10px] tracking-wider text-royal-gold uppercase">AI Recommendations</span>
              </div>
              <div className="space-y-3">
                {[
                  'Complete your profile to unlock premium matches',
                  '3 new compatible matches found this week',
                  'Your horoscope compatibility is 92% with Priya',
                ].map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-royal-gold mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-elite-muted">{rec}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-elite-bg" onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
      {/* Animated Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bgIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-black/85 z-10" />
          <img src={BG_IMAGES[bgIndex]} alt="" className="w-full h-full object-cover" />
        </motion.div>
      </AnimatePresence>

      {/* Floating Particles */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-royal-gold/30 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={particleAnimation}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`p${i}`}
            className="absolute text-2xl select-none"
            style={{ left: `${Math.random() * 100}%`, top: '100%' }}
            animate={petalAnimation}
            transition={{ duration: 8 + Math.random() * 6, repeat: Infinity, delay: i * 1.5 }}
          >
            {['🌸', '✨', '🌺', '💫', '🪷'][i % 5]}
          </motion.div>
        ))}
      </div>

      {/* Top Bar */}
      <div className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
            <Heart className="w-5 h-5 text-elite-bg" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-playfair text-lg font-bold text-royal-gold">Vivahaa Elite</h1>
            <p className="font-mono text-[9px] tracking-[0.2em] text-elite-muted uppercase">Premium Matrimony</p>
          </div>
        </motion.div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setLangOpen(!langOpen)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-elite-muted hover:text-royal-gold transition-colors"
              aria-label="Language"
            >
              <Globe className="w-4 h-4" />
            </motion.button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-10 right-0 z-40 bg-elite-panel/95 backdrop-blur-xl border border-elite-border rounded-xl p-2 shadow-2xl min-w-[140px]"
                >
                  {[
                    { code: 'en', label: 'English', native: 'English' },
                    { code: 'ta', label: 'தமிழ்', native: 'Tamil' },
                  ].map(l => (
                    <button
                      key={l.code}
                      onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false) }}
                      className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-elite-text hover:bg-royal-gold/10 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium">{l.native}</span>
                      <span className="font-mono text-[10px] text-elite-muted">({l.code})</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-elite-muted hover:text-royal-gold transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'elite' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg bg-white/5 border border-white/10 text-elite-muted hover:text-royal-gold transition-colors" aria-label="Help">
            <HelpCircle className="w-4 h-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg bg-white/5 border border-white/10 text-elite-muted hover:text-royal-gold transition-colors" aria-label="Support">
            <HeadphonesIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForgotPassword(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <GlassCard glow className="w-full max-w-md p-8">
                {resetStep === 'email' && (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-7 h-7 text-elite-bg" />
                      </div>
                      <h3 className="font-playfair text-xl font-bold text-elite-text mb-2">{t('forgotPassword.title')}</h3>
                      <p className="text-sm text-elite-muted">{t('forgotPassword.description')}</p>
                    </div>
                    <Input
                      label={t('forgotPassword.email')}
                      type="email"
                      icon={<Mail className="w-4 h-4" />}
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                    <div className="flex gap-3 mt-6">
                      <Button variant="ghost" className="flex-1" onClick={() => setShowForgotPassword(false)}>{t('common.cancel')}</Button>
                      <Button variant="elite" className="flex-1" onClick={handleForgotPassword} disabled={!forgotEmail || isForgotLoading}>
                        {isForgotLoading ? t('common.loading') : t('forgotPassword.sendOTP')}
                      </Button>
                    </div>
                  </>
                )}
                {resetStep === 'otp' && (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                        <Key className="w-7 h-7 text-elite-bg" />
                      </div>
                      <h3 className="font-playfair text-xl font-bold text-elite-text mb-2">Verify OTP</h3>
                      <p className="text-sm text-elite-muted">Enter the 6-digit code sent to your email</p>
                    </div>
                    <div className="flex justify-center gap-2 mb-6">
                      {[...Array(6)].map((_, i) => (
                        <input
                          key={i}
                          type="text"
                          maxLength={1}
                          value={otpValue[i] || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '')
                            const newOtp = otpValue.split('')
                            newOtp[i] = val
                            setOtpValue(newOtp.join(''))
                            if (val && i < 5) (e.target as HTMLElement).nextElementSibling?.querySelector('input')?.focus()
                          }}
                          className="w-10 h-12 text-center text-lg font-bold bg-elite-bg border border-elite-border rounded-lg text-elite-text focus:border-royal-gold focus:outline-none"
                        />
                      ))}
                    </div>
                    <Button variant="elite" className="w-full" onClick={handleVerifyOtp} disabled={otpValue.length < 6 || isOtpLoading}>
                      {isOtpLoading ? t('common.loading') : t('forgotPassword.verifyOTP')}
                    </Button>
                  </>
                )}
                {resetStep === 'password' && (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                        <Key className="w-7 h-7 text-elite-bg" />
                      </div>
                      <h3 className="font-playfair text-xl font-bold text-elite-text mb-2">Reset Password</h3>
                      <p className="text-sm text-elite-muted">Choose a new password for your account</p>
                    </div>
                    <Input label={t('forgotPassword.newPassword')} type="password" icon={<Lock className="w-4 h-4" />} placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <Input label={t('forgotPassword.confirmPassword')} type="password" icon={<Lock className="w-4 h-4" />} placeholder="••••••••" className="mt-4" />
                    <Button variant="elite" className="w-full mt-6" onClick={handleResetPassword} disabled={isResetLoading || !newPassword}>
                      {isResetLoading ? t('common.loading') : t('forgotPassword.resetSuccess')}
                    </Button>
                  </>
                )}
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-30 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-[440px]">
          {/* Daily Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-center"
          >
            <Quote className="w-6 h-6 text-royal-gold/40 mx-auto mb-3" />
            <p className="font-cormorant text-lg sm:text-xl italic text-elite-text/80 leading-relaxed">"{quote.text}"</p>
            <p className="font-mono text-[10px] text-royal-gold/60 mt-2 tracking-widest uppercase">— {quote.author}</p>
          </motion.div>

          {/* Login Card */}
          <GlassCard glow className="p-6 sm:p-8" delay={0.3}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mb-8">
              <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-elite-bg" />
              </div>
              <h2 className="font-playfair text-2xl font-bold text-elite-text">{t('login.title')}</h2>
              <p className="font-mono text-[10px] tracking-[0.15em] text-elite-muted uppercase mt-1">{t(`login.greeting${greetingLabel.charAt(0).toUpperCase()}${greetingLabel.slice(1)}`)}</p>
            <p className="mt-3 text-sm text-elite-muted/80">{t('login.subtitle')}</p>
              <div className="w-16 h-0.5 gold-gradient mx-auto mt-4 rounded-full" />
            </motion.div>

            {/* Success / Error Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6"
                  role="alert"
                >
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 mb-6"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <p className="text-sm text-emerald-400">{successMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Caps Lock Warning */}
            <AnimatePresence>
              {capsLock && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2 mb-4"
                >
                  <span className="text-yellow-500 text-sm" aria-hidden="true">⚠</span>
                  <p className="text-xs text-yellow-400">{t('login.capsLock')}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google OAuth */}
            <div className="space-y-3 mb-6">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white/10 border border-white/20 rounded-xl px-6 py-3 text-sm font-medium text-elite-text hover:bg-white/15 transition-all disabled:opacity-60"
                aria-label="Sign in with Google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {isGoogleLoading ? t('common.loading') : t('login.signInWithGoogle')}
              </motion.button>

              {/* Future OAuth Placeholders */}
              <div className="flex gap-2">
                <motion.button whileHover={{ scale: 1.01 }} className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-elite-muted hover:bg-white/10 transition-all" disabled aria-label="Apple login">
                  <Apple className="w-4 h-4" /> {t('login.comingSoon')}
                </motion.button>
                <motion.button whileHover={{ scale: 1.01 }} className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-elite-muted hover:bg-white/10 transition-all" disabled aria-label="Phone login">
                  <Smartphone className="w-4 h-4" /> {t('login.comingSoon')}
                </motion.button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-elite-border" />
              <span className="font-mono text-[10px] tracking-widest text-elite-muted uppercase">{t('login.orContinueWith')}</span>
              <div className="flex-1 h-px bg-elite-border" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label={t('login.email')}
                type="email"
                icon={<Mail className="w-4 h-4" />}
                placeholder="you@example.com"
                error={errors.email?.message}
                autoComplete="email"
                {...emailFieldProps}
                onFocus={() => setFocusedField('email')}
                onBlur={(event) => {
                  emailFieldProps.onBlur(event)
                  setFocusedField(null)
                }}
              />
              <div>
                <div className="relative">
                  <Input
                    label={t('login.password')}
                    type={showPassword ? 'text' : 'password'}
                    icon={<Lock className="w-4 h-4" />}
                    placeholder="••••••••"
                    error={errors.password?.message}
                    autoComplete="current-password"
                    {...passwordFieldProps}
                    onFocus={() => setFocusedField('password')}
                    onBlur={(event) => {
                      passwordFieldProps.onBlur(event)
                      setFocusedField(null)
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-elite-muted hover:text-royal-gold transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </motion.button>
                </div>

                {/* Password Strength */}
                <AnimatePresence>
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 overflow-hidden"
                    >
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(level => (
                          <div
                            key={level}
                            className={`flex-1 h-1 rounded-full transition-all duration-500 ${level <= pwdStrength.level ? pwdStrength.color : 'bg-elite-border'}`}
                          />
                        ))}
                      </div>
                      <p className={`font-mono text-[10px] tracking-wider uppercase ${pwdStrength.textColor}`}>
                        {t('login.passwordStrength')}: {pwdStrength.label}
                      </p>
                      {password && (
                        <p className={`mt-1 text-[10px] ${isPasswordValid ? 'text-emerald-400' : 'text-elite-muted'}`}>
                          {isPasswordValid ? t('login.passwordStrong') : t('login.passwordHint')}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded border-elite-border bg-elite-panel text-royal-gold focus:ring-royal-gold/50 cursor-pointer"
                  />
                  <span className="text-xs text-elite-muted group-hover:text-elite-text transition-colors">{t('login.rememberMe')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-royal-gold hover:text-royal-gold/80 transition-colors font-medium"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              {import.meta.env.DEV && (
                <div className="rounded-xl border border-royal-gold/20 bg-royal-gold/5 p-3 text-xs text-elite-muted">
                  <p className="font-semibold text-royal-gold mb-2">{t('login.demoAccess')}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button type="button" variant="ghost" size="sm" className="text-[11px]" onClick={() => handleDemoLogin('admin')} disabled={isDemoLoading !== null}>
                      {isDemoLoading === 'admin' ? t('common.loading') : 'Admin Demo'}
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="text-[11px]" onClick={() => handleDemoLogin('user')} disabled={isDemoLoading !== null}>
                      {isDemoLoading === 'user' ? t('common.loading') : 'User Demo'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="elite"
                size="lg"
                className="w-full"
                disabled={isLoading || authLoading}
                icon={
                  isLoading
                    ? <div className="w-4 h-4 border-2 border-elite-bg border-t-transparent rounded-full animate-spin" />
                    : <LogIn className="w-4 h-4" />
                }
              >
                {isLoading ? t('common.loading') : t('login.signIn')}
              </Button>
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { label: t('login.compatibilityScore'), value: '96%', detail: t('login.personalityMatch') },
                { label: t('login.familyValues'), value: '94%', detail: t('login.lifestyleMatch') },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-royal-gold/20 bg-white/5 p-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-royal-gold/70">{item.label}</p>
                  <p className="font-playfair text-xl font-semibold text-elite-text mt-1">{item.value}</p>
                  <p className="text-[11px] text-elite-muted mt-1">{item.detail}</p>
                </div>
              ))}
            </div>

            {/* Register Link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6 text-sm text-elite-muted"
            >
              {t('login.noAccount')}{' '}
              <a href="/register" className="text-royal-gold hover:text-royal-gold/80 font-medium transition-colors inline-flex items-center gap-1">
                {t('login.createAccount')} <ChevronRight className="w-3 h-3" />
              </a>
            </motion.p>
          </GlassCard>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-4 sm:gap-6 mt-8 flex-wrap"
          >
            {TRUST_BADGES.map((badge, i) => (
              <div key={i} className="flex items-center gap-2">
                <badge.icon className={`w-4 h-4 ${badge.color}`} />
                <span className="font-mono text-[9px] tracking-wider text-elite-muted uppercase">{badge.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-6 sm:gap-8 mt-6 flex-wrap"
          >
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-playfair text-lg sm:text-xl font-bold text-royal-gold">{stat.value}</p>
                <p className="font-mono text-[8px] tracking-[0.15em] text-elite-muted uppercase">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* AI Assistant Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, type: 'spring' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAI(!showAI)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gold-gradient flex items-center justify-center shadow-lg shadow-royal-gold/30 hover:shadow-xl hover:shadow-royal-gold/40 transition-shadow"
        aria-label="AI Assistant"
      >
        <Bot className="w-6 h-6 text-elite-bg" />
      </motion.button>

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {showAI && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAI(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, x: 300, y: 300, scale: 0.5 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, y: 300, scale: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-elite-panel/95 backdrop-blur-xl border border-elite-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* AI Header */}
              <div className="bg-gradient-to-r from-royal-gold/20 to-rose-gold/20 p-4 border-b border-elite-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                    <Bot className="w-5 h-5 text-elite-bg" />
                  </div>
                  <div className="flex-1">
                    <p className="font-playfair text-sm font-bold text-elite-text">AI Assistant</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="font-mono text-[9px] text-green-500 tracking-wider uppercase">Online</p>
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowAI(false)} className="text-elite-muted hover:text-royal-gold">
                    <XCircle className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto">
                {/* Daily Quote in AI */}
                <div className="bg-royal-gold/5 border border-royal-gold/20 rounded-xl p-4 mb-4">
                  <Quote className="w-4 h-4 text-royal-gold/60 mb-2" />
                  <p className="text-sm text-elite-text/80 italic leading-relaxed">"{quote.text}"</p>
                  <p className="font-mono text-[9px] text-royal-gold/60 mt-2">— {quote.author}</p>
                </div>

                {/* AI Menu */}
                <div className="space-y-1 mb-4">
                  {AI_MENU_ITEMS.map((item, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ x: 4 }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-royal-gold/10 flex items-center justify-center group-hover:bg-royal-gold/20 transition-colors">
                        <item.icon className="w-4 h-4 text-royal-gold" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-elite-text">{item.label}</p>
                        <p className="font-mono text-[8px] text-elite-muted tracking-wider">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-elite-muted group-hover:text-royal-gold transition-colors" />
                    </motion.button>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="pt-3 border-t border-elite-border">
                  <div className="flex gap-2">
                    <input
                      placeholder="Ask me about matrimony..."
                      className="flex-1 bg-elite-bg border border-elite-border rounded-lg px-3 py-2.5 text-xs text-elite-text placeholder:text-elite-muted/50 focus:border-royal-gold focus:outline-none transition-colors"
                      aria-label="Chat with AI assistant"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 rounded-lg gold-gradient text-elite-bg"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-30 text-center pb-4 px-4"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-3 h-3 text-royal-gold/40" />
          <span className="font-mono text-[8px] tracking-wider text-royal-gold/40 uppercase">Protected by AES-256 & 2FA Ready</span>
        </div>
        <p className="font-mono text-[9px] tracking-wider text-elite-muted">© 2025 Vivahaa Elite Matrimony. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          {['Privacy Policy', 'Terms of Service', 'Safety Tips', 'Cookie Policy'].map(link => (
            <button key={link} className="font-mono text-[9px] tracking-wider text-elite-muted/60 hover:text-royal-gold transition-colors">
              {link}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

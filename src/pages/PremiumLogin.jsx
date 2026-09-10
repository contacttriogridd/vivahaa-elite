import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, Eye, EyeOff, LogIn, Shield, Sparkles, Heart, ChevronRight, Globe, Moon, Sun, HelpCircle, HeadphonesIcon, Bot, Quote, ArrowRight, XCircle, Send } from 'lucide-react'
import { loginSchema } from '../lib/validations'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { GlassCard } from '../components/ui/card'
import i18n from '../lib/i18n'

const BG_IMAGES = [
  'https://images.unsplash.com/photo-1587271636175-90d58cdad458?w=1920&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1920&q=80',
  'https://images.unsplash.com/photo-1465495976272-6807e67e8e64?w=1920&q=80',
]

const DAILY_QUOTES = [
  { text: "A successful marriage requires falling in love many times, always with the same person.", author: "Mignon McLaughlin" },
  { text: "The secret of a happy marriage is finding the right person.", author: "Julia Child" },
  { text: "Love is not about how many days you've been together. Love is about how much you love each other every single day.", author: "Unknown" },
  { text: "A great marriage is when an imperfect couple learns to enjoy their differences.", author: "Dave Meurer" },
]

const TRUST_BADGES = [
  { icon: Shield, label: "100% Verified", color: "text-green-500" },
  { icon: Heart, label: "AI Matchmaking", color: "text-rose-500" },
  { icon: Sparkles, label: "Premium Security", color: "text-royal-gold" },
]

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

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const password = watch('password', '')
  const pwdStrength = getPasswordStrength(password)

  useEffect(() => {
    const bgInterval = setInterval(() => setBgIndex(i => (i + 1) % BG_IMAGES.length), 15000)
    const quoteInterval = setInterval(() => setQuote(DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)]), 30000)
    return () => { clearInterval(bgInterval); clearInterval(quoteInterval) }
  }, [])

  const handleKeyDown = useCallback((e) => setCapsLock(e.getModifierState('CapsLock')), [])
  const handleKeyUp = useCallback((e) => setCapsLock(e.getModifierState('CapsLock')), [])

  const onSubmit = async (data) => {
    setIsLoading(true); setError('')
    try { await login(data.email, data.password, data.rememberMe) }
    catch (err) { setError(err.response?.data?.message || t('login.invalidCredentials')) }
    finally { setIsLoading(false) }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-elite-bg" onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
      <AnimatePresence mode="wait">
        <motion.div key={bgIndex} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-10" />
          <img src={BG_IMAGES[bgIndex]} alt="" className="w-full h-full object-cover" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-1 bg-royal-gold/30 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 2 }} />
        ))}
        {[...Array(5)].map((_, i) => (
          <motion.div key={`p${i}`} className="absolute text-2xl" style={{ left: `${Math.random() * 100}%` }}
            animate={{ y: [0, -120], x: [0, Math.random() > 0.5 ? 60 : -60], opacity: [0, 0.6, 0], rotate: [0, 360] }}
            transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, delay: i * 2 }}>🌸</motion.div>
        ))}
      </div>

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
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.1 }} onClick={() => setLangOpen(!langOpen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-elite-muted hover:text-royal-gold transition-colors">
            <Globe className="w-4 h-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-elite-muted hover:text-royal-gold transition-colors">
            {theme === 'elite' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-elite-muted hover:text-royal-gold transition-colors">
            <HelpCircle className="w-4 h-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-elite-muted hover:text-royal-gold transition-colors">
            <HeadphonesIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {langOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-48 z-40 bg-elite-panel border border-elite-border rounded-xl p-2 shadow-2xl">
            {[
              { code: 'en', label: 'English', native: 'English' },
              { code: 'ta', label: 'தமிழ்', native: 'Tamil' },
            ].map(l => (
              <button key={l.code} onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false) }}
                className="w-full text-left px-4 py-2 rounded-lg text-sm text-elite-text hover:bg-royal-gold/10 transition-colors">
                <span className="font-medium">{l.native}</span>
                <span className="text-elite-muted ml-2">({l.code})</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-30 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-[440px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8 text-center">
            <Quote className="w-6 h-6 text-royal-gold/40 mx-auto mb-3" />
            <p className="font-cormorant text-lg italic text-elite-text/80 leading-relaxed">"{quote.text}"</p>
            <p className="font-mono text-[10px] text-royal-gold/60 mt-2 tracking-widest uppercase">— {quote.author}</p>
          </motion.div>

          <GlassCard glow className="p-8" delay={0.3}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mb-8">
              <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-elite-bg" />
              </div>
              <h2 className="font-playfair text-2xl font-bold text-elite-text">{t('login.title')}</h2>
              <p className="font-mono text-[10px] tracking-[0.15em] text-elite-muted uppercase mt-1">{t('login.subtitle')}</p>
              <div className="w-16 h-0.5 gold-gradient mx-auto mt-4 rounded-full" />
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {capsLock && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2 mb-4">
                  <span className="text-yellow-500 text-sm">⚠</span>
                  <p className="text-xs text-yellow-400">{t('login.capsLock')}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3 mb-6">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white/10 border border-white/20 rounded-xl px-6 py-3 text-sm font-medium text-elite-text hover:bg-white/15 transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t('login.signInWithGoogle')}
              </motion.button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-elite-border" />
              <span className="font-mono text-[10px] tracking-widest text-elite-muted uppercase">{t('login.orContinueWith')}</span>
              <div className="flex-1 h-px bg-elite-border" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label={t('login.email')} type="email" icon={<Mail className="w-4 h-4" />} placeholder="you@example.com"
                error={errors.email?.message} {...register('email')} />
              <div>
                <div className="relative">
                  <Input label={t('login.password')} type={showPassword ? 'text' : 'password'} icon={<Lock className="w-4 h-4" />}
                    placeholder="••••••••" error={errors.password?.message} {...register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-elite-muted hover:text-royal-gold transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(level => (
                        <div key={level} className={`flex-1 h-1 rounded-full transition-all duration-500 ${level <= pwdStrength.level ? pwdStrength.color : 'bg-elite-border'}`} />
                      ))}
                    </div>
                    <p className={`font-mono text-[10px] tracking-wider uppercase ${pwdStrength.textColor}`}>
                      {t('login.passwordStrength')}: {pwdStrength.label}
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register('rememberMe')}
                    className="w-4 h-4 rounded border-elite-border bg-elite-panel text-royal-gold focus:ring-royal-gold/50 cursor-pointer" />
                  <span className="text-xs text-elite-muted group-hover:text-elite-text transition-colors">{t('login.rememberMe')}</span>
                </label>
                <button type="button" className="text-xs text-royal-gold hover:text-royal-gold/80 transition-colors font-medium">
                  {t('login.forgotPassword')}
                </button>
              </div>

              <Button type="submit" variant="elite" size="lg" className="w-full" disabled={isLoading || authLoading}
                icon={isLoading ? <div className="w-4 h-4 border-2 border-elite-bg border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}>
                {isLoading ? t('common.loading') : t('login.signIn')}
              </Button>
            </form>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="text-center mt-6 text-sm text-elite-muted">
              {t('login.noAccount')}{' '}
              <a href="/register" className="text-royal-gold hover:text-royal-gold/80 font-medium transition-colors">
                {t('login.createAccount')} <ArrowRight className="w-3 h-3 inline" />
              </a>
            </motion.p>
          </GlassCard>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-6 mt-8">
            {TRUST_BADGES.map((badge, i) => (
              <div key={i} className="flex items-center gap-2">
                <badge.icon className={`w-4 h-4 ${badge.color}`} />
                <span className="font-mono text-[9px] tracking-wider text-elite-muted uppercase">{badge.label}</span>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-8 mt-6">
            {[
              { value: '12,400+', label: 'Verified Members' },
              { value: '3,200+', label: 'Success Stories' },
              { value: '98%', label: 'Satisfaction' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-playfair text-lg font-bold text-royal-gold">{stat.value}</p>
                <p className="font-mono text-[8px] tracking-[0.15em] text-elite-muted uppercase">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5, type: 'spring' }}
        whileHover={{ scale: 1.1 }} onClick={() => setShowAI(!showAI)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gold-gradient flex items-center justify-center shadow-lg shadow-royal-gold/30">
        <Bot className="w-6 h-6 text-elite-bg" />
      </motion.button>

      <AnimatePresence>
        {showAI && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAI(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, x: 300, y: 300, scale: 0.5 }} animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, y: 300, scale: 0.5 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed bottom-24 right-6 z-50 w-80 bg-elite-panel/95 backdrop-blur-xl border border-elite-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-royal-gold/20 to-rose-gold/20 p-4 border-b border-elite-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                    <Bot className="w-5 h-5 text-elite-bg" />
                  </div>
                  <div>
                    <p className="font-playfair text-sm font-bold text-elite-text">AI Assistant</p>
                    <p className="font-mono text-[9px] text-royal-gold tracking-wider uppercase">Online</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="bg-royal-gold/5 border border-royal-gold/20 rounded-xl p-4 mb-3">
                  <Quote className="w-4 h-4 text-royal-gold/60 mb-2" />
                  <p className="text-sm text-elite-text/80 italic">{quote.text}</p>
                  <p className="font-mono text-[9px] text-royal-gold/60 mt-2">— {quote.author}</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Compatibility Preview', icon: Heart },
                    { label: 'AI Match Prediction', icon: Sparkles },
                    { label: 'Relationship Tips', icon: ChevronRight },
                  ].map((item, i) => (
                    <button key={i}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors">
                      <item.icon className="w-4 h-4 text-royal-gold" />
                      <span className="text-xs text-elite-muted">{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-elite-border">
                  <div className="flex gap-2">
                    <input placeholder="Ask me about matrimony..."
                      className="flex-1 bg-elite-bg border border-elite-border rounded-lg px-3 py-2 text-xs text-elite-text placeholder:text-elite-muted/50 focus:border-royal-gold focus:outline-none" />
                    <button className="p-2 rounded-lg gold-gradient text-elite-bg">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="relative z-30 text-center pb-4">
        <p className="font-mono text-[9px] tracking-wider text-elite-muted">© 2025 Vivahaa Elite Matrimony. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          {['Privacy Policy', 'Terms of Service', 'Safety Tips'].map(link => (
            <button key={link} className="font-mono text-[9px] tracking-wider text-elite-muted/60 hover:text-royal-gold transition-colors">{link}</button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: 'bg-elite-border', textColor: 'text-elite-muted' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  score = Math.min(score, 4)
  const levels = [
    { level: 0, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-400' },
    { level: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-400' },
    { level: 2, label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
    { level: 3, label: 'Strong', color: 'bg-green-500', textColor: 'text-green-400' },
    { level: 4, label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  ]
  return { ...levels[Math.min(score, 4)], level: score }
}

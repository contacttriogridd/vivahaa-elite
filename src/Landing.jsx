import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SUCCESS_STORIES } from './data.js'
import { PLANS } from './lib/plans.ts'

/**
 * Landing page — quiet luxury, not a directory site.
 *
 * Three colours and near-black text (see `vivahaa` in tailwind.config.js). Cormorant
 * Garamond for display, Inter for body, IBM Plex Mono for the small-caps labels; all
 * three are already loaded in index.html.
 *
 * Motion is scroll-triggered fade and slow reveal only. Every transition uses the same
 * ease-out curve below at 600–900ms. No spring, no bounce, no pulsing.
 *
 * Photography slots: the hero and each success story reference files under
 * /public/images/ that are not in the repo yet. Both degrade to a plain tinted ground
 * rather than to placeholder clipart — see HERO_IMAGE and Monogram below.
 */

const EASE_OUT = [0.22, 1, 0.36, 1]

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, ease: EASE_OUT },
}

/**
 * Single, static hero ground — no rotation/crossfade (removed per request).
 *
 * Points at Unsplash's CDN (images.unsplash.com) — a real, verified wedding/couple
 * photograph, free to use including commercially under Unsplash's license, hotlinked
 * directly rather than downloaded and re-hosted. This is a reasonable stopgap, not the
 * final answer: hotlinking means the photo is outside this project's control (could
 * change or 404 if ever taken down) and isn't run through this site's own CDN/caching.
 * Swap it for a file under /public/images/ once real branded photography exists —
 * nothing else here needs to change to do that.
 */
const HERO_IMAGE = 'https://images.unsplash.com/photo-1722952934708-749c22eb2e58?auto=format&fit=crop&w=1600&q=75'

function Label({ children, className = '' }) {
  return (
    <p className={`font-mono text-[10px] uppercase tracking-[0.28em] ${className}`}>{children}</p>
  )
}

function Rule({ className = '' }) {
  return <div className={`h-px w-full bg-vivahaa-line ${className}`} />
}

/** Stand-in for a portrait: the couple's initials, set in the display serif. */
function Monogram({ names }) {
  const initials = names
    .split('&')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join('')
  return (
    <div className="flex aspect-[4/5] w-full items-center justify-center bg-vivahaa-maroon/5">
      <span className="font-cormorant text-6xl font-light tracking-[0.1em] text-vivahaa-maroon/35">
        {initials}
      </span>
    </div>
  )
}

export default function Landing({ setPage }) {
  return (
    <div className="bg-vivahaa-ivory font-inter text-vivahaa-ink">
      <Hero setPage={setPage} />
      <WhyUs />
      <SuccessStories />
      <HowItWorks />
      <Membership setPage={setPage} />
      <Footer setPage={setPage} />
    </div>
  )
}

/* ── 1. Hero ──────────────────────────────────────────────────────────────── */

function Hero({ setPage }) {
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-6 py-28">
      {/* Slow-drifting ground. 28s, ease-in-out — it should read as light changing, not as animation. */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 28, ease: 'easeInOut', repeat: Infinity }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(251,247,240,0.92),rgba(251,247,240,0.99))]"
      />
      <motion.div
        aria-hidden
        className="absolute -left-40 top-0 h-[38rem] w-[38rem] rounded-full bg-vivahaa-maroon/[0.045] blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
        transition={{ duration: 34, ease: 'easeInOut', repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-vivahaa-gold/[0.06] blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -24, 0] }}
        transition={{ duration: 40, ease: 'easeInOut', repeat: Infinity }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        >
          <Label className="text-vivahaa-gold">Tamil Matrimony · Est. Kongu Nadu</Label>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE_OUT }}
          className="mt-8 font-cormorant text-[clamp(2.75rem,7vw,4.75rem)] font-light leading-[1.08] text-vivahaa-maroon"
        >
          Where sacred tradition
          <br />
          meets a life well matched
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: EASE_OUT }}
          className="mx-auto mt-8 max-w-md text-[15px] leading-relaxed text-vivahaa-quiet"
        >
          A small, carefully kept register of families across the Kongu belt. Every profile
          verified by hand, every introduction made with care.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: EASE_OUT }}
          className="mt-12 flex flex-col items-center gap-5"
        >
          <button
            onClick={() => setPage('register')}
            className="border border-vivahaa-maroon bg-vivahaa-maroon px-11 py-4 font-mono text-[11px] uppercase tracking-[0.22em] text-vivahaa-ivory transition-colors duration-500 hover:bg-transparent hover:text-vivahaa-maroon"
          >
            Begin Your Journey
          </button>
          <button
            onClick={() => setPage('premium-login')}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-vivahaa-quiet underline decoration-vivahaa-line underline-offset-[6px] transition-colors duration-500 hover:text-vivahaa-maroon"
          >
            Already a member
          </button>
        </motion.div>
      </div>
    </section>
  )
}

/* ── 2. Why Vivahaa Elite ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    title: 'Verified by hand',
    body: 'Every profile is checked by a person before it appears. No bots, no bought listings, no duplicate accounts.',
  },
  {
    title: 'Family first',
    body: 'Built for the way these decisions are actually made — with parents and elders in the room, not around them.',
  },
  {
    title: 'Discretion by default',
    body: 'Marital history, documents, family numbers and finances stay private unless you decide otherwise.',
  },
  {
    title: 'Horoscope, done properly',
    body: 'Charts calculated from real birth data, never estimated. Matching is offered, never imposed.',
  },
]

function WhyUs() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <motion.div {...reveal} className="max-w-xl">
        <Label className="text-vivahaa-gold">Why Vivahaa Elite</Label>
        <h2 className="mt-6 font-cormorant text-[clamp(2rem,4vw,2.9rem)] font-light leading-tight text-vivahaa-maroon">
          A quieter way to find the right family
        </h2>
      </motion.div>

      <div className="mt-16 grid gap-px bg-vivahaa-line sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, index) => (
          <motion.article
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: EASE_OUT }}
            className="bg-vivahaa-ivory p-8"
          >
            <Label className="text-vivahaa-gold">{String(index + 1).padStart(2, '0')}</Label>
            <h3 className="mt-5 font-cormorant text-[1.6rem] font-normal leading-snug text-vivahaa-maroon">
              {feature.title}
            </h3>
            <p className="mt-4 text-[13.5px] leading-relaxed text-vivahaa-quiet">{feature.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

/* ── 3. Success stories ───────────────────────────────────────────────────── */

const STORY_INTERVAL = 7000

function SuccessStories() {
  const stories = SUCCESS_STORIES
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % stories.length), STORY_INTERVAL)
    return () => clearInterval(timer)
  }, [stories.length])

  const story = stories[index]

  return (
    <section className="border-y border-vivahaa-line bg-white/40 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div {...reveal}>
          <Label className="text-vivahaa-gold">Success Stories</Label>
        </motion.div>

        <div className="mt-14 min-h-[26rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={story.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT }}
              className="grid items-center gap-12 md:grid-cols-[minmax(0,22rem)_1fr]"
            >
              <div className="overflow-hidden">
                <Monogram names={story.names} />
              </div>

              <blockquote>
                <p className="font-cormorant text-[clamp(1.6rem,3.2vw,2.4rem)] font-light italic leading-[1.35] text-vivahaa-maroon">
                  “{story.story}”
                </p>
                <footer className="mt-10">
                  <Rule className="max-w-[3rem] bg-vivahaa-gold" />
                  <p className="mt-6 font-cormorant text-xl text-vivahaa-ink">{story.names}</p>
                  <Label className="mt-2 text-vivahaa-quiet">
                    {story.city} · {story.year}
                  </Label>
                </footer>
              </blockquote>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-12 flex gap-2">
          {stories.map((item, itemIndex) => (
            <button
              key={item.id}
              onClick={() => setIndex(itemIndex)}
              aria-label={`Show the story of ${item.names}`}
              aria-current={itemIndex === index}
              className="py-3"
            >
              <span
                className={`block h-px w-10 transition-colors duration-700 ${
                  itemIndex === index ? 'bg-vivahaa-gold' : 'bg-vivahaa-line'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 4. How it works ──────────────────────────────────────────────────────── */

const PROCESS = [
  {
    step: 'One',
    title: 'Register your profile',
    body: 'Share as much or as little as you wish. Sensitive details stay private from the start.',
  },
  {
    step: 'Two',
    title: 'We verify, then introduce',
    body: 'A person reviews your profile, then brings you a small number of considered matches.',
  },
  {
    step: 'Three',
    title: 'Families meet',
    body: 'We step back. Conversations happen on your terms, at your pace, with your family.',
  },
]

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <motion.div {...reveal} className="max-w-xl">
        <Label className="text-vivahaa-gold">How It Works</Label>
        <h2 className="mt-6 font-cormorant text-[clamp(2rem,4vw,2.9rem)] font-light leading-tight text-vivahaa-maroon">
          Three steps, and no hurry
        </h2>
      </motion.div>

      <div className="relative mt-20">
        {/* The thin line that connects the three steps. */}
        <div aria-hidden className="absolute left-0 right-0 top-[7px] hidden h-px bg-vivahaa-line md:block" />

        <div className="grid gap-14 md:grid-cols-3 md:gap-10">
          {PROCESS.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: index * 0.14, ease: EASE_OUT }}
              className="relative"
            >
              <span
                aria-hidden
                className="relative z-10 block h-[15px] w-[15px] rounded-full border border-vivahaa-gold bg-vivahaa-ivory"
              />
              <Label className="mt-8 text-vivahaa-gold">{item.step}</Label>
              <h3 className="mt-4 font-cormorant text-[1.7rem] font-normal leading-snug text-vivahaa-maroon">
                {item.title}
              </h3>
              <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-vivahaa-quiet">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 5. Membership ────────────────────────────────────────────────────────── */

function Membership({ setPage }) {
  const standard = PLANS.standard
  const recommendedId = 'gold'

  return (
    <section className="border-t border-vivahaa-line py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div {...reveal} className="max-w-xl">
          <Label className="text-vivahaa-gold">Membership</Label>
          <h2 className="mt-6 font-cormorant text-[clamp(2rem,4vw,2.9rem)] font-light leading-tight text-vivahaa-maroon">
            Choose the level of attention you want
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-px bg-vivahaa-line md:grid-cols-3">
          {standard.map((plan, index) => {
            const recommended = plan.id === recommendedId
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: EASE_OUT }}
                className="flex flex-col bg-vivahaa-ivory p-9"
              >
                <div className="flex items-baseline justify-between">
                  <Label className={recommended ? 'text-vivahaa-gold' : 'text-vivahaa-quiet'}>
                    {plan.name}
                  </Label>
                  {recommended && <Label className="text-vivahaa-gold">Recommended</Label>}
                </div>

                <p className="mt-7 font-cormorant text-5xl font-light text-vivahaa-maroon">
                  ₹{plan.price.toLocaleString('en-IN')}
                </p>
                <Label className="mt-2 text-vivahaa-quiet">Per month</Label>

                <ul className="mt-9 flex-1 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-[13.5px] leading-relaxed text-vivahaa-quiet">
                      <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-vivahaa-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setPage('register')}
                  className={`mt-10 border px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors duration-500 ${
                    recommended
                      ? 'border-vivahaa-gold bg-vivahaa-gold text-vivahaa-ink hover:bg-transparent hover:text-vivahaa-maroon'
                      : 'border-vivahaa-line text-vivahaa-maroon hover:border-vivahaa-maroon'
                  }`}
                >
                  Get started
                </button>
              </motion.div>
            )
          })}
        </div>

        <motion.div {...reveal} className="mt-24 max-w-xl border-t border-vivahaa-line pt-16">
          <Label className="text-vivahaa-gold">Elite</Label>
          <h2 className="mt-6 font-cormorant text-[clamp(2rem,4vw,2.9rem)] font-light leading-tight text-vivahaa-maroon">
            For families who want a matchmaker, not a directory
          </h2>
        </motion.div>

        {/*
          Elite cards stay within the Landing page's own restrained vivahaa.* palette
          (no fourth colour, no switch to the app's separate elite/royal dark theme) —
          a dark maroon ground is what signals "different tier" here, not a different
          brand. This grid is the platform's real visual differentiator; see the note
          in src/pages/Dashboard.tsx once it exists for the equivalent inside the app.
        */}
        <div className="mt-16 grid gap-px bg-vivahaa-gold/25 md:grid-cols-2">
          {PLANS.elite.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: EASE_OUT }}
              className="flex flex-col bg-vivahaa-maroon p-9 text-vivahaa-ivory"
            >
              <Label className="text-vivahaa-gold">{plan.name}</Label>
              <p className="mt-7 font-cormorant text-5xl font-light">
                ₹{plan.price.toLocaleString('en-IN')}
              </p>
              <Label className="mt-2 text-vivahaa-ivory/55">Per month</Label>

              <ul className="mt-9 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-[13.5px] leading-relaxed text-vivahaa-ivory/80">
                    <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-vivahaa-gold" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.eliteBenefits && (
                <>
                  <Label className="mt-8 text-vivahaa-gold">Elite benefits</Label>
                  <ul className="mt-4 flex-1 space-y-4">
                    {plan.eliteBenefits.map((benefit) => (
                      <li key={benefit} className="flex gap-3 text-[13.5px] leading-relaxed text-vivahaa-ivory/80">
                        <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-vivahaa-gold" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <button
                onClick={() => setPage('register')}
                className="mt-10 border border-vivahaa-gold bg-vivahaa-gold px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-vivahaa-ink transition-colors duration-500 hover:bg-transparent hover:text-vivahaa-gold"
              >
                Request an introduction
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 6. Footer ────────────────────────────────────────────────────────────── */

function Footer({ setPage }) {
  return (
    <footer className="bg-vivahaa-maroon px-6 py-20 text-vivahaa-ivory">
      <div className="mx-auto max-w-6xl">
        <p className="font-cormorant text-3xl font-light tracking-wide">Vivahaa Elite</p>
        <div className="mt-8 h-px w-full bg-vivahaa-gold/25" />

        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          <div>
            <Label className="text-vivahaa-gold">Contact</Label>
            <p className="mt-4 text-[13px] leading-relaxed text-vivahaa-ivory/65">
              Coimbatore · Tirupur · Erode
              <br />
              Namakkal · Salem · Dindigul
            </p>
          </div>
          <div>
            <Label className="text-vivahaa-gold">Members</Label>
            <ul className="mt-4 space-y-2.5">
              <li>
                <button
                  onClick={() => setPage('register')}
                  className="text-[13px] text-vivahaa-ivory/65 transition-colors duration-300 hover:text-vivahaa-gold"
                >
                  Register
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPage('premium-login')}
                  className="text-[13px] text-vivahaa-ivory/65 transition-colors duration-300 hover:text-vivahaa-gold"
                >
                  Sign in
                </button>
              </li>
            </ul>
          </div>
          <div>
            <Label className="text-vivahaa-gold">Legal</Label>
            <ul className="mt-4 space-y-2.5">
              {['Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item} className="text-[13px] text-vivahaa-ivory/65">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 h-px w-full bg-vivahaa-gold/25" />
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-vivahaa-ivory/40">
          © {new Date().getFullYear()} Vivahaa Elite Matrimony
        </p>
      </div>
    </footer>
  )
}

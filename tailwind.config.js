/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        royal: { gold: '#D4AF37', goldlight: '#F0D68A', maroon: '#7B1E2B', deep: '#5C1520' },
        ivory: '#FFF8F0',
        rose: { gold: '#E8C4B8', light: '#F8E8E0' },
        elite: { bg: '#0B0A09', panel: '#17130F', primary: '#5C1A27', gold: '#D9B24C', text: '#F3E9D2', border: '#3A311F', muted: '#8A7A5A' },
        std: { bg: '#FBF7F0', panel: '#F3ECDF', primary: '#7A2436', gold: '#C6982F', text: '#2B2521', border: '#E5DAC5', muted: '#8B7355' },
        // Landing page palette. Three colours plus near-black text — nothing else.
        // Adding a fourth brand colour here is what makes a matrimony site look cheap.
        vivahaa: {
          ivory: '#FBF7F0',
          maroon: '#5B1A2E',
          emerald: '#0F3D2E', // documented alternative to maroon; not currently used
          gold: '#C9A24B',
          ink: '#1A1613',
          quiet: '#6E6459', // near-black at reduced weight, for secondary copy
          line: '#E3DACB', // hairline rules
        },
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        poppins: ['Poppins', 'sans-serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
        glow: { '0%': { boxShadow: '0 0 20px rgba(212,175,55,0.2)' }, '100%': { boxShadow: '0 0 40px rgba(212,175,55,0.4)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseGold: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(30px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        scaleIn: { '0%': { opacity: 0, transform: 'scale(0.95)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-shine': 'linear-gradient(135deg, #D4AF37 0%, #F0D68A 50%, #D4AF37 100%)',
      },
    },
  },
  plugins: [],
}

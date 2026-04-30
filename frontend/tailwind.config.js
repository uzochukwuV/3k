/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        navy: {
          950: '#020818',
          900: '#040f1e',
          800: '#081526',
          700: '#0d1e36',
          600: '#132544',
          500: '#1a3057',
          400: '#1d3f72',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3074fd',
          600: '#1a5de8',
          700: '#1a4fca',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      boxShadow: {
        glow: '0 0 60px rgba(48, 116, 253, 0.2)',
        'glow-sm': '0 0 24px rgba(48, 116, 253, 0.12)',
        card: '0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.5)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.07) inset, 0 16px 48px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(ellipse 900px 500px at 50% -10%, rgba(48,116,253,0.18) 0%, transparent 70%)',
        'card-shine':
          'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'brand-gradient': 'linear-gradient(135deg, #3074fd 0%, #60a5fa 100%)',
        'positive-gradient': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
        'check-draw': 'checkDraw 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        checkDraw: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}

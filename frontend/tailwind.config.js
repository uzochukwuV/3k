/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Raleway"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Raleway"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f7f7fb',
          100: '#eeeff7',
          200: '#d8d9ea',
          300: '#b8bad7',
          400: '#8f93bb',
          500: '#6d739f',
          600: '#535a83',
          700: '#414765',
          800: '#2a2f47',
          900: '#171a2a',
          950: '#0d0f1a',
        },
        flare: {
          50: '#fff5f0',
          100: '#ffe4d4',
          200: '#ffc3a2',
          300: '#ff9b6a',
          400: '#ff6d2a',
          500: '#ff4b00',
          600: '#e33d00',
          700: '#bb2f00',
          800: '#8f2400',
          900: '#631800',
        },
      },
      boxShadow: {
        halo: '0 0 0 1px rgba(255,255,255,0.08), 0 18px 50px rgba(0,0,0,0.55)',
        lift: '0 1px 0 rgba(255,255,255,0.08) inset, 0 24px 70px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        'mesh-hero':
          'radial-gradient(1200px 600px at 20% 10%, rgba(255, 75, 0, 0.20), transparent 60%), radial-gradient(900px 450px at 85% 25%, rgba(255, 186, 146, 0.16), transparent 55%), radial-gradient(700px 380px at 65% 80%, rgba(109, 115, 159, 0.22), transparent 55%)',
        grain:
          'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27160%27 height=%27160%27 filter=%27url(%23n)%27 opacity=%270.10%27/%3E%3C/svg%3E")',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

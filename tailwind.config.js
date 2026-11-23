/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tokens temáticos: invertem automaticamente entre tema escuro e claro
        black: v('c-black'),
        white: v('c-white'),
        app: v('c-app'),
        surface: v('c-surface'),
        'surface-2': v('c-surface-2'),
        line: v('c-line'),
        'line-strong': v('c-line-strong'),
        neutral: {
          50: v('n-50'),
          100: v('n-100'),
          200: v('n-200'),
          300: v('n-300'),
          400: v('n-400'),
          500: v('n-500'),
          600: v('n-600'),
          700: v('n-700'),
          800: v('n-800'),
          900: v('n-900'),
          950: v('n-950'),
        },
        green: {
          300: v('g-300'),
          400: v('g-400'),
          500: '#22C55E',
          600: '#16A34A',
        },
        red: {
          300: v('r-300'),
          400: v('r-400'),
          500: '#EF4444',
          600: '#DC2626',
        },
        sport: {
          orange: '#FC4C02',
          'orange-hover': '#FF5E1A',
          'orange-dark': '#D94100',
        },
        // Paleta preservada para o Card PNG clássico
        brand: {
          wine: '#4E0E22',
          'wine-dark': '#3A0918',
          'wine-light': '#7E1D3B',
          terracotta: '#B8734B',
          'terracotta-dark': '#9E5D38',
          'terracotta-light': '#D49A76',
          cream: '#FAF7F5',
          sand: '#F2EAE4',
          border: '#E8DDD5',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Barlow Condensed"', '"Inter"', 'sans-serif'],
        script: ['"Pacifico"', '"Brush Script MT"', 'cursive'],
      },
    },
  },
  plugins: [],
};

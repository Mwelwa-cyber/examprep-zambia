/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        zambia: {
          green:  '#2E7D32',
          gold:   '#F9A825',
          red:    '#B71C1C',
          black:  '#212121',
        },
      },
      keyframes: {
        'scale-in':  { '0%': { opacity: 0, transform: 'scale(0.92)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        'slide-up':  { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'fade-in':   { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
      animation: {
        'scale-in': 'scale-in 0.22s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'fade-in':  'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

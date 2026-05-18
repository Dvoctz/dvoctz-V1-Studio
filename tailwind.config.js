/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./{components,views,context,data,api}/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#020617', // Extremely dark slate / almost black
        'secondary': '#0f172a', // Deep slate
        'accent': '#1e293b', // Muted slate
        'highlight': '#d4af37', // Luxury Metallic Gold
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 15px -3px rgba(212, 175, 55, 0.4)',
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
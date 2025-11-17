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
        'primary': '#1a202c',
        'secondary': '#2d3748',
        'accent': '#4a5568',
        'highlight': '#38b2ac',
        'text-primary': '#edf2f7',
        'text-secondary': '#a0aec0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
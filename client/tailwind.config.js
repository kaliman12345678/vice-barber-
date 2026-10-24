/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        barber: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          gold: '#f59e0b',
          goldLight: '#fbbf24',
          accent: '#d97706',
          red: '#dc2626',
          blue: '#2563eb'
        }
      }
    },
  },
  plugins: [],
}

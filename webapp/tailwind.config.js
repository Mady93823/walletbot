/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Blue-500
        secondary: '#10B981', // Emerald-500
        dark: {
          bg: '#0F172A', // Slate-900
          card: '#1E293B', // Slate-800
          text: '#F8FAFC', // Slate-50
        }
      }
    },
  },
  plugins: [],
}
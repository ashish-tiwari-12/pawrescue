/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#006c49',
          orange: '#f97316',
          dark: '#0f172a',
          slate: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}

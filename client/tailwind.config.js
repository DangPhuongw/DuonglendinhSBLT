/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        olympia: {
          gold: '#FFD700',
          blue: '#1E3A8A',
          darkBlue: '#0F172A',
          red: '#DC2626',
          green: '#16A34A',
        }
      }
    },
  },
  plugins: [],
}

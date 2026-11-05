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
        },
        neo: {
          yellow: '#E8FE36',
          yellowDark: '#D4EB27',
          black: '#000000',
          white: '#FFFFFF',
          blue: '#A5C9FF',
          pink: '#FFB5D5',
          green: '#7BF1A8',
          bg: '#FAF9F2',
          muted: '#F0EFE6',
        }
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px 0px #000000',
        'neo': '4px 4px 0px 0px #000000',
        'neo-lg': '6px 6px 0px 0px #000000',
        'neo-xl': '8px 8px 0px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}

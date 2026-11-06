/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        arena: {
          white: '#FFFFFF',
          bg: '#FFFDF7',
          yellow: '#FFE45C',
          black: '#171717',
          pink: '#FF9292',
          coral: '#FF9292',
          mint: '#55D6C2',
          purple: '#A98BFF',
          blue: '#66C7F2',
          textPrimary: '#171717',
          textSecondary: '#666666',
          textMuted: '#999999',
        },
        answer: {
          a: '#FF9292',
          b: '#66C7F2',
          c: '#FFE45C',
          d: '#55D6C2',
        },
        // Maintain backwards compatibility if needed
        olympia: {
          gold: '#FFE45C',
          blue: '#66C7F2',
          darkBlue: '#171717',
          red: '#FF9292',
          green: '#55D6C2',
        }
      },
      boxShadow: {
        'neo-sm': '3px 3px 0px 0px #171717',
        'neo': '4px 4px 0px 0px #171717',
        'neo-lg': '6px 6px 0px 0px #171717',
      },
      borderWidth: {
        '2': '2px',
        '3': '3px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}

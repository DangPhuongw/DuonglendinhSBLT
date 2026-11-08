/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Montserrat"', '"Be Vietnam Pro"', '"Inter"', 'sans-serif'],
        display: ['"Montserrat"', '"Be Vietnam Pro"', '"Inter"', 'sans-serif'],
        mono: ['"Rajdhani"', 'monospace'],
        digital: ['"Rajdhani"', 'sans-serif'],
      },
      colors: {
        // Dark Gaming Show Tokens
        dark: {
          bg: '#090D18',
          surface: '#111827',
          elevated: '#1C2638',
          border: '#303D52',
          card: '#111827',
        },
        accent: {
          yellow: '#FFD43B',
          cyan: '#00D9FF',
          purple: '#A855F7',
          danger: '#FF496C',
          success: '#20D6A0',
        },
        arenaText: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        arena: {
          white: '#F8FAFC',
          bg: '#090D18',
          surface: '#111827',
          elevated: '#1C2638',
          border: '#303D52',
          yellow: '#FFD43B',
          black: '#090D18',
          pink: '#FF496C',
          coral: '#FF496C',
          mint: '#20D6A0',
          purple: '#A855F7',
          blue: '#00D9FF',
          textPrimary: '#F8FAFC',
          textSecondary: '#94A3B8',
          textMuted: '#64748B',
        },
        answer: {
          a: '#FF496C',
          b: '#00D9FF',
          c: '#FFD43B',
          d: '#20D6A0',
        },
        olympia: {
          gold: '#FFD43B',
          blue: '#00D9FF',
          darkBlue: '#090D18',
          red: '#FF496C',
          green: '#20D6A0',
        }
      },
      boxShadow: {
        'glow-yellow': '0 0 15px rgba(255, 212, 59, 0.35)',
        'glow-yellow-lg': '0 0 25px rgba(255, 212, 59, 0.55)',
        'glow-cyan': '0 0 15px rgba(0, 217, 255, 0.35)',
        'glow-cyan-lg': '0 0 25px rgba(0, 217, 255, 0.55)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.35)',
        'glow-danger': '0 0 15px rgba(255, 73, 108, 0.4)',
        'glow-success': '0 0 15px rgba(32, 214, 160, 0.4)',
        'dark-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'dark-elevated': '0 8px 30px -4px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        // Retain neo shadows for backwards compatibility if needed
        'neo-sm': '0 0 10px rgba(0, 217, 255, 0.15)',
        'neo': '0 4px 15px rgba(0, 0, 0, 0.4)',
        'neo-lg': '0 8px 25px rgba(0, 0, 0, 0.6)',
      },
      borderWidth: {
        '1': '1px',
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

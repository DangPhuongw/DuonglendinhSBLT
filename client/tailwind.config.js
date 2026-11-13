/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Thân chữ: Be Vietnam Pro (thiết kế cho tiếng Việt). Tiêu đề: Chakra Petch (vát góc, kiểu kỹ thuật).
        // Số điểm / mã phòng: Oxanium (vuông vức, kiểu bảng điện tử), rơi về Chakra Petch với dấu tiếng Việt.
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Chakra Petch"', '"Be Vietnam Pro"', 'sans-serif'],
        display: ['"Chakra Petch"', '"Be Vietnam Pro"', 'sans-serif'],
        mono: ['"Oxanium"', '"Chakra Petch"', 'monospace'],
        digital: ['"Oxanium"', '"Chakra Petch"', 'sans-serif'],
      },
      colors: {
        // ===== Galaxy tokens =====
        space: {
          void: '#05060F',
          deep: '#080B1E',
          surface: '#0A0D22',
          elevated: '#11163A',
          line: '#262E66',
        },
        star: {
          gold: '#F7C873',
          pale: '#FBE0A8',
          ice: '#7CB4FF',
          violet: '#9B7BFF',
          rose: '#FF5D8F',
          mint: '#43E6B5',
        },
        dark: {
          bg: '#05060F',
          surface: '#0A0D22',
          elevated: '#11163A',
          border: '#262E66',
          card: '#0A0D22',
        },
        accent: {
          yellow: '#F7C873',
          cyan: '#7CB4FF',
          purple: '#9B7BFF',
          danger: '#FF5D8F',
          success: '#43E6B5',
        },
        arenaText: {
          primary: '#EEF0FF',
          secondary: '#A6ACDB',
          muted: '#6D75AD',
        },
        arena: {
          white: '#EEF0FF',
          bg: '#05060F',
          surface: '#0A0D22',
          elevated: '#11163A',
          border: '#262E66',
          yellow: '#F7C873',
          black: '#05060F',
          pink: '#FF5D8F',
          coral: '#FF5D8F',
          mint: '#43E6B5',
          purple: '#9B7BFF',
          blue: '#7CB4FF',
          textPrimary: '#EEF0FF',
          textSecondary: '#A6ACDB',
          textMuted: '#6D75AD',
        },
        answer: {
          a: '#FF5D8F',
          b: '#7CB4FF',
          c: '#F7C873',
          d: '#43E6B5',
        },
        olympia: {
          gold: '#F7C873',
          blue: '#7CB4FF',
          darkBlue: '#05060F',
          red: '#FF5D8F',
          green: '#43E6B5',
        }
      },
      boxShadow: {
        // Viền mảnh + quầng sáng nhỏ: đỡ "neon rẻ tiền" hơn kiểu bóng đổ to
        'glow-yellow': '0 0 0 1px rgba(247, 200, 115, 0.28), 0 0 22px -6px rgba(247, 200, 115, 0.45)',
        'glow-yellow-lg': '0 0 0 1px rgba(247, 200, 115, 0.4), 0 0 38px -6px rgba(247, 200, 115, 0.6)',
        'glow-cyan': '0 0 0 1px rgba(124, 180, 255, 0.28), 0 0 22px -6px rgba(124, 180, 255, 0.45)',
        'glow-cyan-lg': '0 0 0 1px rgba(124, 180, 255, 0.4), 0 0 38px -6px rgba(124, 180, 255, 0.6)',
        'glow-purple': '0 0 0 1px rgba(155, 123, 255, 0.3), 0 0 24px -6px rgba(155, 123, 255, 0.5)',
        'glow-danger': '0 0 0 1px rgba(255, 93, 143, 0.3), 0 0 22px -6px rgba(255, 93, 143, 0.5)',
        'glow-danger-lg': '0 0 0 1px rgba(255, 93, 143, 0.4), 0 0 38px -6px rgba(255, 93, 143, 0.6)',
        'glow-success': '0 0 0 1px rgba(67, 230, 181, 0.3), 0 0 22px -6px rgba(67, 230, 181, 0.5)',
        'dark-card': '0 10px 30px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 0 rgba(180, 190, 255, 0.07)',
        'dark-elevated': '0 18px 40px -16px rgba(0, 0, 0, 0.85), inset 0 1px 0 0 rgba(180, 190, 255, 0.1)',
        'neo-sm': '0 0 10px rgba(124, 180, 255, 0.15)',
        'neo': '0 4px 15px rgba(0, 0, 0, 0.4)',
        'neo-lg': '0 8px 25px rgba(0, 0, 0, 0.6)',
      },
      borderWidth: {
        '1': '1px',
        '2': '2px',
        '3': '3px',
      },
      // Góc bo nhỏ và gọn hơn: bớt vẻ "viên thuốc / app mẫu", hợp tinh thần khoang điều khiển
      borderRadius: {
        'sm': '2px',
        'md': '4px',
        'lg': '6px',
        'xl': '8px',
        '2xl': '10px',
        '3xl': '14px',
      }
    },
  },
  plugins: [],
}

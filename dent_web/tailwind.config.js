/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(249, 44%, 61%)', // #7E70C5
          hover: 'hsl(249, 44%, 53%)',
          light: 'hsl(252, 70%, 90%)', // #D7CFF9
        },
        customBg: 'hsl(230, 60%, 98%)', // #F8F9FE
        cardBg: '#FFFFFF',
        textPrimary: 'hsl(210, 10%, 11%)',
        textSecondary: 'hsl(220, 3%, 37%)',
        'accent-yellow': 'hsl(46, 100%, 81%)',
        'accent-blue': 'hsl(204, 100%, 88%)',
        'blue-bg': 'hsl(207, 90%, 94%)',
        'orange-bg': 'hsl(36, 100%, 94%)',
        'light-blue-bg': 'hsl(198, 100%, 94%)',
        divider: 'hsl(0, 0%, 93%)',
      },
      borderRadius: {
        DEFAULT: '12px',
        'lg': '20px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(126, 112, 197, 0.08)',
        'soft-hover': '0 8px 30px rgba(126, 112, 197, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}

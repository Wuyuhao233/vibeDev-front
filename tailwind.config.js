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
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        like: '#ef4444',
        collect: '#f59e0b',
        essence: '#f59e0b',
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
               '"PingFang SC"', '"Microsoft YaHei"', '"Helvetica Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Consolas"', '"Courier New"', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '1.4'],
        'xs': ['12px', '1.5'],
        'sm': ['13px', '1.5'],
        'base': ['14px', '1.6'],
        'lg': ['16px', '1.5'],
        'xl': ['18px', '1.4'],
        '2xl': ['20px', '1.3'],
        '3xl': ['24px', '1.3'],
        '4xl': ['30px', '1.2'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacing: {
        'sidebar': '240px',
        'content': '1200px',
      },
      borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.10)',
        'modal': '0 4px 16px rgba(0,0,0,0.12)',
        'drawer': '0 8px 24px rgba(0,0,0,0.15)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'spin-slow': 'spin 0.6s linear infinite',
        'shake': 'shake 300ms ease',
        'fade-in': 'fadeIn 200ms ease',
        'slide-up': 'slideUp 200ms ease-out',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { backgroundColor: '#e5e7eb' },
          '50%': { backgroundColor: '#f3f4f6' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

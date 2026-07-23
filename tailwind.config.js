/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0a0c',
          1: '#111114',
          2: '#18181c',
          3: '#202026',
          4: '#2a2a32',
          5: '#35353f',
        },
        amber: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        coral: {
          400: '#fb7185',
          500: '#f43f5e',
        },
        mint: {
          400: '#34d399',
          500: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'glow-amber': '0 0 20px -5px rgba(251, 191, 36, 0.15)',
        'glow-amber-lg': '0 0 40px -10px rgba(251, 191, 36, 0.2)',
        'glow-mint': '0 0 20px -5px rgba(52, 211, 153, 0.15)',
        'deep': '0 8px 32px -8px rgba(0,0,0,0.6), 0 2px 8px -2px rgba(0,0,0,0.3)',
        'deep-lg': '0 16px 64px -16px rgba(0,0,0,0.7), 0 4px 16px -4px rgba(0,0,0,0.3)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.03)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px -5px rgba(251, 191, 36, 0.1)' },
          '100%': { boxShadow: '0 0 30px -5px rgba(251, 191, 36, 0.25)' },
        },
      },
    },
  },
  plugins: [],
}

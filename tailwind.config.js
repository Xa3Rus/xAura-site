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
          0: '#000000',
          1: '#0A0A0A',
          2: '#111111',
          3: '#1A1A1A',
          4: '#222222',
          5: '#2A2A2A',
        },
        primary: {
          DEFAULT: '#BBF351',
          light: '#D4F785',
          dark: '#9EDB3E',
          darker: '#7FB32F',
        },
        secondary: {
          DEFAULT: '#00E5FF',
          light: '#66F0FF',
          dark: '#00C4DB',
          darker: '#00A3B8',
        },
        accent: {
          orange: '#FF9F0A',
          cyan: '#00E5FF',
          red: '#FF3366',
          purple: '#BF5AF2',
        },
        success: {
          DEFAULT: '#00CC88',
          light: '#00FF93',
        },
        warning: {
          DEFAULT: '#FF8A33',
          light: '#FFB066',
        },
        danger: {
          DEFAULT: '#FF3366',
          light: '#FF6688',
          lightened: '#FF88A0',
        },
        text: {
          DEFAULT: '#F0F0F0',
          secondary: '#A0A0A0',
          muted: '#707070',
          subtle: '#525252',
        },
        neon: {
          300: '#D4F785',
          400: '#BBF351',
          500: '#9EDB3E',
          600: '#7FB32F',
        },
        cyan: {
          300: '#66F0FF',
          400: '#00E5FF',
          500: '#00C4DB',
          600: '#00A3B8',
        },
        coral: {
          400: '#FF5C93',
          500: '#FF2D78',
        },
        mint: {
          400: '#33EBD4',
          500: '#00E5CC',
        },
        brand: {
          softer: '#0D1A02',
          soft: '#1A3306',
          medium: '#2D4A0F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Quantico', 'Inter', 'sans-serif'],
        mono: ['"Source Code Pro"', 'monospace'],
        gaming: ['Quantico', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'xl': '8px',
        '2xl': '12px',
        '3xl': '16px',
      },
      boxShadow: {
        'glow-neon': '0 0 0 1px rgba(187, 243, 81, 0.35), 0 0 20px -4px rgba(187, 243, 81, 0.25)',
        'glow-neon-lg': '0 0 0 1px rgba(187, 243, 81, 0.4), 0 0 40px -8px rgba(187, 243, 81, 0.35)',
        'glow-neon-xl': '0 0 0 1px rgba(187, 243, 81, 0.45), 0 0 60px -10px rgba(187, 243, 81, 0.5)',
        'glow-cyan': '0 0 20px -5px rgba(0, 229, 255, 0.35)',
        'glow-cyan-lg': '0 0 40px -10px rgba(0, 229, 255, 0.45)',
        'glow-amber': '0 0 20px -5px rgba(255, 159, 10, 0.25)',
        'glow-mint': '0 0 20px -5px rgba(0, 229, 204, 0.25)',
        'neon': '0 1px 0 rgba(187, 243, 81, 0.12), 0 0 24px -8px rgba(187, 243, 81, 0.2)',
        'neon-md': '0 4px 6px -1px rgba(0,0,0,0.3), 0 0 15px -4px rgba(187, 243, 81, 0.1)',
        'neon-lg': '0 10px 15px -3px rgba(0,0,0,0.4), 0 0 25px -5px rgba(187, 243, 81, 0.12)',
        'soft': '0 1px 2px rgba(0,0,0,0.3)',
        'soft-md': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.26)',
        'soft-lg': '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.3)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
        'vignette': 'inset 0 0 150px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'neon-flicker': 'neonFlicker 3s ease-in-out infinite',
        'glow-border': 'glowBorder 2s ease-in-out infinite alternate',
        'slide-glow': 'slideGlow 3s linear infinite',
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
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px -4px rgba(187, 243, 81, 0.15)' },
          '100%': { boxShadow: '0 0 30px -4px rgba(187, 243, 81, 0.35)' },
        },
        neonFlicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        glowBorder: {
          '0%': { borderColor: 'rgba(187, 243, 81, 0.3)' },
          '100%': { borderColor: 'rgba(187, 243, 81, 0.6)' },
        },
        slideGlow: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-neon': 'linear-gradient(135deg, #BBF351 0%, #D4F785 50%, #BBF351 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #00E5FF 0%, #66F0FF 50%, #00E5FF 100%)',
        'gradient-dark': 'linear-gradient(180deg, #000000 0%, #0A0A0A 50%, #000000 100%)',
      },
    },
  },
  plugins: [],
}

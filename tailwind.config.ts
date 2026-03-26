import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        primary: {
          DEFAULT: '#E91E63',
          dark: '#C2185B',
          light: '#F06292',
        },
        secondary: {
          DEFAULT: '#311848',
          light: '#4A2470',
        },
        accent: {
          DEFAULT: '#A57DDB',
          light: '#C4A8E8',
        },
        surface: {
          DEFAULT: '#1A1A1A',
          raised: '#242424',
          overlay: '#2E2E2E',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B0B0',
          muted: '#6B6B6B',
        },
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Archivo', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #311848 0%, #E91E63 100%)',
        'gradient-card': 'linear-gradient(145deg, #1A1A1A 0%, #242424 100%)',
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        input: '10px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(233, 30, 99, 0.3)',
        'glow-accent': '0 0 20px rgba(165, 125, 219, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(233, 30, 99, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(233, 30, 99, 0.6)' },
        },
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
} satisfies Config

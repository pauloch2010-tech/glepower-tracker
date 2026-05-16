import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0D',
        primary: {
          DEFAULT: '#FF4E8B',
          dark: '#C33764',
          light: '#FF7BAC',
        },
        secondary: {
          DEFAULT: '#6A0DAD',
          light: '#8A2DC0',
        },
        accent: {
          DEFAULT: '#D4A5A5',
          light: '#E8C4C4',
        },
        surface: {
          DEFAULT: '#1C1C1E',
          raised: '#2C2C2E',
          overlay: '#3A3A3C',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#F5F5F7',
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
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #4A0D67 0%, #6A0DAD 35%, #C33764 70%, #FF4E8B 100%)',
        'gradient-card': 'linear-gradient(145deg, #1C1C1E 0%, #2C2C2E 100%)',
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        input: '10px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px rgba(255, 78, 139, 0.35)',
        'glow-accent': '0 0 20px rgba(212, 165, 165, 0.3)',
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 78, 139, 0.35)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 78, 139, 0.65)' },
        },
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
} satisfies Config

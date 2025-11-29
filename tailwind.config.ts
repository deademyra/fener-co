import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Fenerbahçe Primary Colors
        fb: {
          navy: '#1E3A8A',
          'navy-dark': '#152a64',
          'navy-light': '#2d4ea6',
          yellow: '#FCD34D',
          'yellow-dark': '#F59E0B',
          'yellow-light': '#FDE68A',
          gold: '#FBBF24',
        },
        // Background Colors
        bg: {
          primary: '#0f172a',
          secondary: '#1e293b',
          card: 'rgba(30, 41, 59, 0.8)',
          'card-solid': 'rgba(30, 41, 59, 0.95)',
        },
        // Text Colors
        text: {
          primary: '#ffffff',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        // Border Colors
        border: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.15)',
        },
        // Rating Colors
        rating: {
          excellent: '#22c55e',
          good: '#84cc16',
          average: '#eab308',
          poor: '#f97316',
          bad: '#ef4444',
        },
        // Status Colors
        status: {
          live: '#ef4444',
          win: '#22c55e',
          draw: '#f59e0b',
          loss: '#ef4444',
        },
        // UI Colors
        pitch: {
          green: '#2d5a27',
          'green-light': '#3d7a37',
        },
        opponent: '#2865a4',
        // Legacy status colors (backwards compatibility)
        live: '#ef4444',
        win: '#22c55e',
        draw: '#f59e0b',
        loss: '#ef4444',
      },
      fontFamily: {
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card': '1.5rem',
        'button': '1rem',
        'badge': '9999px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-body': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gradient-fb': 'linear-gradient(135deg, #1E3A8A 0%, #2d4ea6 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(30, 41, 59, 0.8) 100%)',
        'pitch-pattern': 'linear-gradient(90deg, transparent 49.5%, rgba(255,255,255,0.1) 49.5%, rgba(255,255,255,0.1) 50.5%, transparent 50.5%)',
        'navy-gradient': 'linear-gradient(135deg, #1E3A8A 0%, #152a64 100%)',
        'hero-gradient': 'linear-gradient(180deg, rgba(30,58,138,0.95) 0%, rgba(21,42,100,0.98) 100%)',
        'pitch-stripes': 'repeating-linear-gradient(0deg, #2d5a27 0px, #2d5a27 20px, #3d7a37 20px, #3d7a37 40px)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.2)',
        'card-lg': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow-yellow': '0 0 30px rgba(252, 211, 77, 0.3)',
        'glow-navy': '0 0 30px rgba(30, 58, 138, 0.5)',
        'inner-glow': 'inset 0 2px 4px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-live': 'pulse-live 2s ease-in-out infinite',
        'pulse-slow': 'pulse-live 3s ease-in-out infinite',
        'pulse-scale': 'pulse-scale 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'logo-scroll': 'logo-scroll 12s infinite cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'logo-scroll': {
          '0%, 10%': { transform: 'translateY(0)' },
          '14.2%, 24.2%': { transform: 'translateY(-1em)' },
          '28.5%, 38.5%': { transform: 'translateY(-2em)' },
          '42.8%, 52.8%': { transform: 'translateY(-3em)' },
          '57.1%, 67.1%': { transform: 'translateY(-4em)' },
          '71.4%, 81.4%': { transform: 'translateY(-5em)' },
          '85.7%, 95.7%': { transform: 'translateY(-6em)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      aspectRatio: {
        'pitch': '68 / 105',
        'pitch-horizontal': '105 / 68',
      },
    },
  },
  plugins: [],
};

export default config;

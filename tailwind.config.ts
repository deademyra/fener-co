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
        // UI Colors
        pitch: {
          green: '#2d5a27',
          'green-light': '#3d7a37',
        },
        // Status Colors
        live: '#ef4444',
        win: '#22c55e',
        draw: '#f59e0b',
        loss: '#ef4444',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'pitch-pattern': 'linear-gradient(90deg, transparent 49.5%, rgba(255,255,255,0.1) 49.5%, rgba(255,255,255,0.1) 50.5%, transparent 50.5%)',
        'navy-gradient': 'linear-gradient(135deg, #1E3A8A 0%, #152a64 100%)',
        'hero-gradient': 'linear-gradient(180deg, rgba(30,58,138,0.95) 0%, rgba(21,42,100,0.98) 100%)',
      },
      animation: {
        'pulse-live': 'pulse-live 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'logo-scroll': 'logo-scroll 12s infinite cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
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
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.2)',
        'glow-yellow': '0 0 30px rgba(252, 211, 77, 0.3)',
        'glow-navy': '0 0 30px rgba(30, 58, 138, 0.3)',
        'inner-glow': 'inset 0 2px 4px rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;

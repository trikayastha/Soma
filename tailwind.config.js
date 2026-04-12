/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        soma: {
          ink: '#0B0D12',
          night: '#11141C',
          slate: '#1B1F2A',
          mist: '#8A93A6',
          moon: '#E8E4D2',
          glow: '#F4EFD9',
          accent: '#C9A24B',
          crimson: '#B85C5C',
          sage: '#7BA38F',
        },
      },
      fontFamily: {
        display: ['"Lora"', 'Georgia', 'serif'],
        sans: ['"Raleway"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        phone: '0 40px 80px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
        glow: '0 0 40px rgba(244,239,217,0.18)',
      },
      animation: {
        'breathe': 'breathe 8s ease-in-out infinite',
        'breathe-cue': 'breatheCue 12s ease-in-out infinite',
        'rise': 'rise 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        // Inhale 4s · hold 2s · exhale 6s = 12s cycle
        breatheCue: {
          '0%':   { transform: 'scale(0.86)', opacity: '0.65' },
          '33.3%':{ transform: 'scale(1.14)', opacity: '1' },
          '50%':  { transform: 'scale(1.14)', opacity: '1' },
          '100%': { transform: 'scale(0.86)', opacity: '0.65' },
        },
        rise: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

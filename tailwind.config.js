/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mars: {
          void: '#07090D',
          dark: '#0C1118',
          card: 'rgba(12, 17, 24, 0.82)',
          border: 'rgba(255, 255, 255, 0.12)',
          'border-active': 'rgba(226, 87, 43, 0.55)',
          rust: '#E2572B',
          'rust-light': '#F07548',
          'rust-glow': 'rgba(226, 87, 43, 0.25)',
          cyan: '#4FD1C5',
          'cyan-dark': '#1F7A70',
          'cyan-glow': 'rgba(79, 209, 197, 0.25)',
          amber: '#F6B042',
          red: '#EF4444',
          text: '#E8E6E1',
          muted: '#8E96A4',
          dim: '#4A5568'
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif']
      },
      backdropBlur: {
        hud: '16px',
      },
      boxShadow: {
        'hud-glow': '0 0 20px rgba(79, 209, 197, 0.15)',
        'rust-glow': '0 0 25px rgba(226, 87, 43, 0.35)',
        'amber-glow': '0 0 20px rgba(246, 176, 66, 0.25)',
        'red-glow': '0 0 25px rgba(239, 68, 68, 0.45)',
      },
      animation: {
        'radar-sweep': 'radar 3.5s linear infinite',
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'reticle-spin': 'spin 12s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }
    },
  },
  plugins: [],
}

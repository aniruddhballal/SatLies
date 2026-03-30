/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#020409',
          900: '#030812',
          800: '#060e1e',
          700: '#0a1628',
        },
        orbit: {
          DEFAULT: '#38bdf8',
          dim: '#0ea5e9',
        },
        ground: {
          DEFAULT: '#4ade80',
          dim: '#22c55e',
        },
        burn: {
          DEFAULT: '#fb923c',
          dim: '#f97316',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      }
    },
  },
  plugins: [],
}
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        page:      '#f0f2f8',
        blue:      { DEFAULT: '#1d3fa0', light: '#dce7ff', mid: '#3b60d0' },
        gold:      { DEFAULT: '#a07020', light: '#fdf3d8', mid: '#c9961a' },
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body:    ['Figtree', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config

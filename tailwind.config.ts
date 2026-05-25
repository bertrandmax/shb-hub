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
        page:    '#f0f2f8',
        sidebar: '#0d1d5a',
        blue:    { DEFAULT: '#1d3fa0', light: '#dce7ff', mid: '#3b60d0', dark: '#0d1d5a' },
        gold:    { DEFAULT: '#a07020', light: '#fdf3d8', mid: '#c9961a' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-md':  '0 4px 12px 0 rgb(0 0 0 / 0.09), 0 1px 4px -1px rgb(0 0 0 / 0.05)',
        'card-lg':  '0 8px 24px 0 rgb(0 0 0 / 0.10), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
        'topbar':   '0 1px 0 0 rgb(0 0 0 / 0.12)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '150': '150ms',
      },
    },
  },
  plugins: [],
}

export default config

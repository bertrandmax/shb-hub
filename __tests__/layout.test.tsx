// __tests__/layout.test.tsx
import { render } from '@testing-library/react'
import RootLayout from '@/app/layout'
import { vi } from 'vitest'

vi.mock('next/font/google', () => ({
  Unbounded:     () => ({ variable: '--font-display' }),
  Figtree:       () => ({ variable: '--font-body' }),
  IBM_Plex_Mono: () => ({ variable: '--font-mono' }),
}))

test('renders children', () => {
  const { getByText } = render(<RootLayout><div>hello</div></RootLayout>)
  expect(getByText('hello')).toBeInTheDocument()
})

test('html element carries all three font CSS variables', () => {
  const { container } = render(<RootLayout><div>test</div></RootLayout>)
  // In jsdom, rendered html content is inside a div; check className on the outermost element
  const html = container.firstElementChild as HTMLElement
  expect(html.className).toContain('--font-display')
  expect(html.className).toContain('--font-body')
  expect(html.className).toContain('--font-mono')
})

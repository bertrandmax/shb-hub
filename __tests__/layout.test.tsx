import { render } from '@testing-library/react'
import RootLayout from '@/app/layout'

vi.mock('next/font/google', () => ({
  Unbounded:    () => ({ variable: '--font-display' }),
  Figtree:      () => ({ variable: '--font-body' }),
  IBM_Plex_Mono: () => ({ variable: '--font-mono' }),
}))

test('renders children', () => {
  const { getByText } = render(
    <RootLayout><div>hello</div></RootLayout>
  )
  expect(getByText('hello')).toBeInTheDocument()
})

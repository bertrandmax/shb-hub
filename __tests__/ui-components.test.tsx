import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

test('Button renders with label', () => {
  render(<Button>Save</Button>)
  expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
})

test('Card renders children', () => {
  render(<Card>Content</Card>)
  expect(screen.getByText('Content')).toBeInTheDocument()
})

test('Badge renders label', () => {
  render(<Badge variant="blue">PM</Badge>)
  expect(screen.getByText('PM')).toBeInTheDocument()
})

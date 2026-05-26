import { fmtIDR } from '@/lib/format'

test('fmtIDR formats a positive number with IDR symbol', () => {
  expect(fmtIDR(1_000_000)).toContain('1.000.000')
})

test('fmtIDR returns em dash for null', () => {
  expect(fmtIDR(null)).toBe('—')
})

test('fmtIDR formats zero', () => {
  expect(fmtIDR(0)).toContain('0')
})

test('fmtIDR has no decimal places', () => {
  expect(fmtIDR(1500)).not.toContain(',')
})

import { getEventCountdown } from '@/lib/event-date'

test('returns before phase with correct daysUntil on Oct 1', () => {
  expect(getEventCountdown(new Date('2026-10-01'))).toEqual({ phase: 'before', daysUntil: 32 })
})

test('returns before phase D-1 on Nov 1', () => {
  expect(getEventCountdown(new Date('2026-11-01'))).toEqual({ phase: 'before', daysUntil: 1 })
})

test('returns during phase Day 1 on Nov 2', () => {
  expect(getEventCountdown(new Date('2026-11-02'))).toEqual({ phase: 'during', dayNumber: 1 })
})

test('returns during phase Day 6 on Nov 7', () => {
  expect(getEventCountdown(new Date('2026-11-07'))).toEqual({ phase: 'during', dayNumber: 6 })
})

test('returns ended phase on Nov 8', () => {
  expect(getEventCountdown(new Date('2026-11-08'))).toEqual({ phase: 'ended' })
})

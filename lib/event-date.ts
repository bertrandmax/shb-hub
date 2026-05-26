export const EVENT_START = new Date('2026-11-02T00:00:00')
export const EVENT_END   = new Date('2026-11-07T00:00:00')

export type CountdownState =
  | { phase: 'before'; daysUntil: number }
  | { phase: 'during'; dayNumber: number }
  | { phase: 'ended' }

export function getEventCountdown(today: Date = new Date()): CountdownState {
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)

  const start = new Date(EVENT_START)
  start.setHours(0, 0, 0, 0)
  const end = new Date(EVENT_END)
  end.setHours(0, 0, 0, 0)

  if (t > end) return { phase: 'ended' }
  if (t >= start) {
    const dayNumber = Math.floor((t.getTime() - start.getTime()) / 86_400_000) + 1
    return { phase: 'during', dayNumber }
  }
  const daysUntil = Math.ceil((start.getTime() - t.getTime()) / 86_400_000)
  return { phase: 'before', daysUntil }
}

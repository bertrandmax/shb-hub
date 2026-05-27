export function fmtMYR(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
  }).format(value)
}

// Keep for backward compatibility
export const fmtIDR = fmtMYR

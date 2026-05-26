import '@testing-library/jest-dom/vitest'

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return { ...actual, cache: actual.cache ?? ((fn: unknown) => fn) }
})

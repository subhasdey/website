import '@testing-library/jest-dom/vitest'

const globalAny = global as unknown as { fetch?: typeof fetch }

if (!globalAny.fetch) {
  globalAny.fetch = async () => {
    throw new Error('global.fetch not mocked')
  }
}
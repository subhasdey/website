import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@/': '/workspace/glow-clone/src/',
      '@': '/workspace/glow-clone/src',
    },
  },
})
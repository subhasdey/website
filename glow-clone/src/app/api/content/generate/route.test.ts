import { describe, expect, it, vi } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/openai', () => ({
  generateText: vi.fn(async () => 'Hello world'),
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    store: {
      upsert: vi.fn(async () => ({})),
    },
    contentAsset: {
      create: vi.fn(async (args: any) => ({ id: '1', ...args.data })),
    },
  },
}))

vi.mock('@/lib/store', () => ({ ensureStore: vi.fn(async () => ({})) }))

function makeReq(url: string, body?: any) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

describe('content generate API', () => {
  const base = 'http://localhost/api/content/generate'

  it('validates payload', async () => {
    const res = await POST(makeReq(base, {}))
    expect(res.status).toBe(400)
  })

  it('creates asset with generated body', async () => {
    const res = await POST(
      makeReq(base, { storeId: 'demo', type: 'POST', topic: 'Hello', tone: 'friendly' })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.item.body).toContain('Hello world')
  })
})
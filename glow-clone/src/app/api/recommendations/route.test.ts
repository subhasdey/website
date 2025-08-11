import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

vi.mock('@/lib/prisma', () => {
  return {
    default: {
      store: {
        upsert: vi.fn(async () => ({})),
      },
      recommendation: {
        findMany: vi.fn(async () => []),
        create: vi.fn(async (args: any) => ({ id: '1', status: 'OPEN', ...args.data })),
      },
    },
  }
})

function makeReq(url: string, body?: any) {
  return new Request(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('recommendations API', () => {
  const base = 'http://localhost/api/recommendations'

  it('GET requires storeId', async () => {
    const res = await GET(makeReq(base))
    expect(res.status).toBe(400)
  })

  it('GET returns items', async () => {
    const res = await GET(makeReq(base + '?storeId=demo'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ items: [] })
  })

  it('POST validates payload and creates', async () => {
    const res = await POST(
      makeReq(base, {
        storeId: 'demo',
        title: 'Do X',
        description: 'Desc',
        priority: 'HIGH',
        score: 90,
      })
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.item.title).toBe('Do X')
  })
})
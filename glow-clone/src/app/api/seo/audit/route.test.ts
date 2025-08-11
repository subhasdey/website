import { describe, expect, it } from 'vitest'
import { POST } from './route'

function makeReq(url: string, body?: any) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

describe('seo audit API', () => {
  const base = 'http://localhost/api/seo/audit'

  it('requires url', async () => {
    const res = await POST(makeReq(base, {}))
    expect(res.status).toBe(400)
  })

  it('returns score and issues', async () => {
    const res = await POST(makeReq(base, { url: 'https://example.com' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.score).toBeGreaterThan(0)
    expect(Array.isArray(json.issues)).toBe(true)
  })
})
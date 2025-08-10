'use client'

import { useState } from 'react'

export default function SEOPage() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<{ score: number; issues: { id: string; severity: string; message: string }[] } | null>(null)

  async function onAudit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/seo/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    setResult(await res.json())
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">SEO Audit</h1>

      <form onSubmit={onAudit} className="rounded-lg border bg-white p-4 space-y-3 max-w-xl">
        <div>
          <label className="block text-sm text-gray-600 mb-1">URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded">Run audit</button>
      </form>

      {result && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <div className="text-sm text-gray-600">Score</div>
          <div className="text-3xl font-bold">{result.score}</div>
          <div>
            <h2 className="font-semibold mb-1">Issues</h2>
            <ul className="list-disc pl-5 text-sm">
              {(result.issues ?? []).map((i: { id: string; severity: string; message: string }) => (
                <li key={i.id}>
                  <span className="font-medium">[{i.severity}]</span> {i.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
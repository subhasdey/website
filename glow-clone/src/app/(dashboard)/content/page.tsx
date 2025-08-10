'use client'

import { useState } from 'react'

const storeId = 'demo-store'

export default function ContentPage() {
  const [type, setType] = useState<'POST' | 'AD_COPY' | 'EMAIL' | 'BLOG' | 'PRODUCT_DESC'>('POST')
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('friendly')
  const [output, setOutput] = useState('')

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/content/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, type, topic, tone }),
    })
    const data = await res.json()
    setOutput(data?.item?.body ?? '')
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Content Studio</h1>

      <form onSubmit={onGenerate} className="rounded-lg border bg-white p-4 space-y-3 max-w-xl">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as 'POST' | 'AD_COPY' | 'EMAIL' | 'BLOG' | 'PRODUCT_DESC')} className="w-full border rounded px-3 py-2">
            <option value="POST">Social Post</option>
            <option value="AD_COPY">Ad Copy</option>
            <option value="EMAIL">Email</option>
            <option value="BLOG">Blog</option>
            <option value="PRODUCT_DESC">Product Description</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Topic</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tone</label>
          <input value={tone} onChange={(e) => setTone(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded">Generate</button>
      </form>

      {output && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold mb-2">Output</h2>
          <pre className="whitespace-pre-wrap text-sm">{output}</pre>
        </div>
      )}
    </div>
  )
}
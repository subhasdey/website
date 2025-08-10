'use client'

import useSWR from 'swr'
import { useState } from 'react'

const storeId = 'demo-store'
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function CampaignsPage() {
  const { data, mutate } = useSWR(`/api/campaigns?storeId=${storeId}`, fetcher)
  const [name, setName] = useState('')
  const [objective, setObjective] = useState('')

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, name, objective, channels: [] }),
    })
    setName('')
    setObjective('')
    mutate()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Campaigns</h1>

      <form onSubmit={onCreate} className="rounded-lg border bg-white p-4 space-y-3 max-w-xl">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Objective</label>
          <input value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded">Create</button>
      </form>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Objective</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((c: { id: string; name: string; objective: string; status: string }) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.objective}</td>
                <td className="p-3">{c.status}</td>
              </tr>
            ))}
            {!data?.items?.length && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={3}>
                  No campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
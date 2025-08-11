'use client'

import useSWR from 'swr'

const storeId = 'demo-store'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data } = useSWR(`/api/recommendations?storeId=${storeId}`, fetcher)

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold mb-2">Scorecard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">Marketing Health</div>
            <div className="text-3xl font-bold">78</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">Open Recommendations</div>
            <div className="text-3xl font-bold">{data?.items?.length ?? 0}</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">Potential Uplift</div>
            <div className="text-3xl font-bold">$12.4k</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Prioritized recommendations</h2>
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Score</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((r: { id: string; title: string; priority: string; score: number; status: string }) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.title}</td>
                  <td className="p-3">{r.priority}</td>
                  <td className="p-3">{r.score}</td>
                  <td className="p-3">{r.status}</td>
                </tr>
              ))}
              {!data?.items?.length && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={4}>
                    No recommendations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">AI Marketing Copilot for Shopify</h1>
        <p className="text-gray-600">Identify revenue opportunities, generate content, plan campaigns, and optimize SEO — without prompts.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard" className="bg-gray-900 text-white px-4 py-2 rounded">Open dashboard</Link>
          <Link href="/campaigns" className="border px-4 py-2 rounded">Plan a campaign</Link>
        </div>
      </div>
    </main>
  )
}

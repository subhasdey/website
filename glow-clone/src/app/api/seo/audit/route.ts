import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  // Simple stubbed audit
  const issues = [
    { id: 'meta-title', severity: 'MEDIUM', message: 'Meta title could be more descriptive' },
    { id: 'alt-text', severity: 'HIGH', message: 'Some product images are missing alt text' },
    { id: 'page-speed', severity: 'LOW', message: 'Consider optimizing large images' },
  ]
  const score = 78

  return NextResponse.json({ url, score, issues })
}
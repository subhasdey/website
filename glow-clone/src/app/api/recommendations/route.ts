import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createRecommendationSchema } from '@/lib/validation'
import { ensureStore } from '@/lib/store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 })

  const items = await prisma.recommendation.findMany({
    where: { storeId },
    orderBy: [{ priority: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const json = await req.json()
  const parsed = createRecommendationSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { storeId, title, description, priority, score } = parsed.data
  await ensureStore(storeId)
  const item = await prisma.recommendation.create({
    data: { storeId, title, description, priority, score },
  })
  return NextResponse.json({ item }, { status: 201 })
}
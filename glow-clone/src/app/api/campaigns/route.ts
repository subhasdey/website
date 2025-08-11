import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createCampaignSchema } from '@/lib/validation'
import { ensureStore } from '@/lib/store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 })

  const items = await prisma.campaign.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const json = await req.json()
  const parsed = createCampaignSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { storeId, name, objective, channels, budget, startDate, endDate } = parsed.data
  await ensureStore(storeId)
  const item = await prisma.campaign.create({
    data: {
      storeId,
      name,
      objective,
      channels: channels ?? [],
      budget,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  })
  return NextResponse.json({ item }, { status: 201 })
}
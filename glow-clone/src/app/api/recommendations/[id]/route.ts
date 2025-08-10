import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { updateRecommendationSchema } from '@/lib/validation'

export async function PATCH(req: Request) {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() as string

  const json = await req.json()
  const parsed = updateRecommendationSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.recommendation.update({
    where: { id },
    data: parsed.data,
  })
  return NextResponse.json({ item: updated })
}
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateContentSchema } from '@/lib/validation'
import { generateText } from '@/lib/openai'
import { ensureStore } from '@/lib/store'

export async function POST(req: NextRequest) {
  const json = await req.json()
  const parsed = generateContentSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { storeId, type, topic, tone, keywords, product } = parsed.data

  const system = `You are a senior e-commerce marketer for Shopify merchants. Write ${type} content in a ${tone} tone. Optimize lightly for SEO with provided keywords. Keep it actionable and concise.`

  const parts = [
    `Topic: ${topic}`,
    product ? `Product: ${product.name}\nFeatures: ${(product.features ?? []).join(', ')}` : '',
    keywords?.length ? `Keywords: ${keywords.join(', ')}` : '',
  ].filter(Boolean)

  const body = await generateText(system, parts.join('\n'))

  await ensureStore(storeId)
  const item = await prisma.contentAsset.create({
    data: {
      storeId,
      type,
      title: topic,
      body,
      meta: { tone, keywords: keywords ?? [], product: product ?? null },
    },
  })

  return NextResponse.json({ item })
}
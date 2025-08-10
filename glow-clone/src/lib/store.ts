import prisma from '@/lib/prisma'

export async function ensureStore(storeId: string) {
  return prisma.store.upsert({
    where: { id: storeId },
    update: {},
    create: { id: storeId, name: storeId },
  })
}
import { z } from 'zod'

export const storeIdParamSchema = z.object({ storeId: z.string().min(1) })

export const createRecommendationSchema = z.object({
  storeId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(3),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  score: z.number().int().min(0).max(100).default(50),
})

export const updateRecommendationSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).optional(),
  score: z.number().int().min(0).max(100).optional(),
})

export const createCampaignSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(3),
  objective: z.string().min(3),
  channels: z.array(z.string()).default([]),
  budget: z.number().min(0).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const generateContentSchema = z.object({
  storeId: z.string().min(1),
  type: z.enum(['POST', 'AD_COPY', 'EMAIL', 'BLOG', 'PRODUCT_DESC']),
  topic: z.string().min(3),
  tone: z.string().default('friendly'),
  keywords: z.array(z.string()).optional(),
  product: z
    .object({ name: z.string(), features: z.array(z.string()).optional() })
    .optional(),
})

export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>
export type UpdateRecommendationInput = z.infer<typeof updateRecommendationSchema>
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type GenerateContentInput = z.infer<typeof generateContentSchema>
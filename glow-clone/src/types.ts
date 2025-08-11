export type RecommendationDTO = {
  id: string
  storeId: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  score: number
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE'
}

export type CampaignDTO = {
  id: string
  storeId: string
  name: string
  objective: string
  channels: string[] | null
  budget: number
  status: string
}

export type ContentAssetDTO = {
  id: string
  storeId: string
  type: 'POST' | 'AD_COPY' | 'EMAIL' | 'BLOG' | 'PRODUCT_DESC'
  title: string
  body: string
}
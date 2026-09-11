import type {
  DocumentStatus,
  InvitationStatus,
  Role,
  AIModelConfig,
  TokenUsageLog,
  User,
  SystemSetting,
} from '@/lib/prisma'
import type { DocumentTocTree } from './stair'

export interface TopicSubcategoryItem {
  id: string
  categoryId: string
  name: string
  slug?: string
  code: string
  description: string | null
  order?: number
  isActive?: boolean
  _count?: {
    messages?: number
    preguntas?: number
  }
}

export interface TopicCategoryItem {
  id: string
  name: string
  slug?: string
  code: string
  description: string | null
  icon?: string | null
  order: number
  isActive?: boolean
  subcategories: TopicSubcategoryItem[]
  createdAt?: Date | string
  updatedAt?: Date | string
  _count?: {
    documents?: number
    messages?: number
    preguntas?: number
    subcategories?: number
  }
}

export interface DocumentItem {
  id: string
  title: string
  fileName: string
  fileUrl: string | null
  publicUrl: string | null
  mimeType: string
  sizeBytes: number
  fileSize?: number
  status: DocumentStatus
  chunkCount: number
  categoryId: string | null
  subcategoryId?: string | null
  categoryName?: string | null
  subcategoryName?: string | null
  category?: {
    id: string
    name: string
    code: string
  } | null
  createdAt: Date | string
  updatedAt?: Date | string
  uploadedBy?: {
    name: string | null
    email: string
  } | string | null
  tocTree?: DocumentTocTree | any | null
}

export interface QuestionItem {
  id: string
  text: string
  icon: string
  category: string | null
  categoryId?: string | null
  subcategoryId?: string | null
  categoryRel?: {
    id: string
    name: string
    code: string
    slug?: string
  } | null
  subcategoryRel?: {
    id: string
    name: string
    code: string
    slug?: string
  } | null
  creadoPor?: { id: string; name: string | null; email: string } | null
  order: number
  isActive: boolean
  createdAt?: Date | string
}

export interface AdminUserItem {
  id: string
  name: string | null
  firstName?: string | null
  lastName?: string | null
  image?: string | null
  email: string
  role: Role
  isPrimaryAdmin?: boolean
  isInitialAdmin?: boolean
  createdAt?: Date | string
}

export interface AdminInvitationItem {
  id: string
  email: string
  role: Role
  token: string
  status: InvitationStatus
  expiresAt: Date | string
  createdAt?: Date | string
  createdByName?: string
  invitedBy?: {
    name: string | null
    email: string
  } | null
}

export type TokenUsageLogWithUser = TokenUsageLog & {
  user?: Pick<User, 'name' | 'email'> | null
}

export interface TokenUsageStats {
  totalTokens: number
  totalCostUsd: number
  totalLogsCount: number
  byConcept: Record<string, { tokens: number; cost: number; count: number }>
  recentLogs: TokenUsageLogWithUser[]
  modelsStats: Pick<
    AIModelConfig,
    | 'id'
    | 'name'
    | 'modelCode'
    | 'provider'
    | 'totalInferences'
    | 'totalTokensUsed'
    | 'estimatedCostUsd'
    | 'inputPricePerMillion'
    | 'outputPricePerMillion'
  >[]
}

export type SystemSettingConfig = SystemSetting & {
  enableRAG: boolean
  enableWebSearch: boolean
  enableMapsSearch: boolean
  enableImageAnalysis: boolean
  minSimilarityScore: number
}

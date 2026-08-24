import type { DocumentStatus, InvitationStatus, Role } from '@/lib/prisma'

export interface TopicSubcategoryItem {
  id: string
  categoryId: string
  name: string
  code: string
  description: string | null
  _count?: {
    messages?: number
    preguntas?: number
  }
}

export interface TopicCategoryItem {
  id: string
  name: string
  code: string
  description: string | null
  order: number
  subcategories: TopicSubcategoryItem[]
  _count?: {
    documents?: number
    messages?: number
    preguntas?: number
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
  status: DocumentStatus
  chunkCount: number
  categoryId: string | null
  category?: {
    id: string
    name: string
    code: string
  } | null
  createdAt: Date
  uploadedBy?: {
    name: string | null
    email: string
  } | null
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
  } | null
  subcategoryRel?: {
    id: string
    name: string
    code: string
  } | null
  order: number
  isActive: boolean
  createdAt: Date
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
  createdAt: Date
}

export interface AdminInvitationItem {
  id: string
  email: string
  role: Role
  token: string
  status: InvitationStatus
  expiresAt: Date
  createdAt: Date
  invitedBy?: {
    name: string | null
    email: string
  } | null
}

import type { ModelProvider, ModelStatus } from '@/lib/prisma'

export interface SidebarChat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  lastMessageSnippet?: string
}

export interface CodeBlockProps {
  code: string
  lang?: string
  title?: string
}

export interface ModelInformation {
  id: string
  name: string
  modelCode: string
  provider: ModelProvider
  description: string
  status: ModelStatus
  latencyMs?: number
  isDefault: boolean
}

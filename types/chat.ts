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

export interface MessageAttachment {
  id: string
  name: string
  size: string
  type: string
  url?: string
}

export interface MessageSource {
  chunkId?: string | null
  documentId?: string | null
  title: string
  url?: string
  snippet?: string
  relevance?: number
  embeddingModel?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  modelName?: string
  modelProvider?: string
  embeddingModel?: string
  reasoning?: string
  attachments?: MessageAttachment[]
  rating?: number
  latencyMs?: number
  retrievalLatencyMs?: number
  generationLatencyMs?: number
  parentId?: string | null
  isRegeneration?: boolean
  regeneratedFromId?: string | null
  sources?: MessageSource[]
  // Soporte de Ramificación y Versionado de Respuestas
  versions?: ChatMessage[]
  currentVersionIndex?: number
}

export interface AttachedFile {
  id: string
  name: string
  size: string
  type: string
  file: File
}

export interface FeedbackState {
  messageId: string
  userQuestion: string
  assistantResponse: string
  modelName: string
  type: 'Adecuada' | 'Inadecuada' | null
  initialRating?: number
}

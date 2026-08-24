import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Re-exportar tipos y enums desde un único punto para evitar bundles duplicados
export {
  Role,
  ModelProvider,
  ModelStatus,
  MessageRole,
  PostStatus,
  DocumentStatus,
} from '@prisma/client'
export type {
  User,
  Account,
  Session,
  UserMemory,
  Conversation,
  Message,
  MessageCitation,
  Document,
  DocumentChunk,
  AIModelConfig,
  SystemSetting,
  UserUsage,
  Post,
  Category,
  Feedback,
  RequestLog,
  Pregunta,
} from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const connectionString = process.env.DATABASE_URL || ''
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

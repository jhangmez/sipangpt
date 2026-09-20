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
  InvitationStatus,
  ResolutionStatus,
  TokenUsageConcept,
  Prisma,
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
  TopicCategory,
  TopicSubcategory,
  AIModelConfig,
  SystemSetting,
  UserUsage,
  Post,
  Category,
  Feedback,
  RequestLog,
  Pregunta,
  AdminInvitation,
  TokenUsageLog,
} from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  pool?: Pool
}

const connectionString = process.env.DATABASE_URL || ''
const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX) || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

// Prevenir que desconexiones de clientes ociosos por parte de Neon dejen el pool inoperable
pool.on('error', (err) => {
  console.error('[PG_POOL_ERROR] Error inesperado en cliente inactivo del pool:', err)
})

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}

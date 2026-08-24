import { prisma } from '@/lib/prisma'

interface AuditLogOptions {
  userId?: string | null
  endpoint?: string
  method?: string
  statusCode?: number
  ipAddress?: string
  userAgent?: string
  durationMs?: number
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '')
    }
  },

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '')
  },

  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, meta ? JSON.stringify(meta) : '')
  },

  async logRequest(opts: AuditLogOptions) {
    try {
      await prisma.requestLog.create({
        data: {
          userId: opts.userId ?? null,
          endpoint: opts.endpoint ?? null,
          method: opts.method ?? null,
          statusCode: opts.statusCode ?? 200,
          ipAddress: opts.ipAddress ?? null,
          userAgent: opts.userAgent ?? null,
          durationMs: opts.durationMs ?? null,
        },
      })
    } catch (err) {
      console.error('[LOGGER_ERROR] Fallo al persistir log de solicitud:', err)
    }
  },
}

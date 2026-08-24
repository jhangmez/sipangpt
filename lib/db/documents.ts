import { prisma } from '@/lib/prisma'
import { cache } from 'react'

/**
 * Obtiene la lista de documentos subidos para el panel de administración
 */
export const getAdminDocuments = cache(async () => {
  return prisma.document.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { chunks: true, citations: true },
      },
    },
  })
})

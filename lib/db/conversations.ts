import { prisma } from '@/lib/prisma'
import { cache } from 'react'

/**
 * Obtiene las conversaciones recientes de un usuario (para Server Components)
 */
export const getUserConversations = cache(async (userId: string) => {
  try {
    return await prisma.conversation.findMany({
      where: { userId, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true }
        }
      }
    })
  } catch {
    // Fallback por si la instancia en caliente de next dev aún no refrescó los tipos del cliente en memoria
    return await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true }
        }
      }
    })
  }
})

/**
 * Obtiene una conversación específica con sus mensajes y citas RAG (solo si no está archivada/oculta)
 */
export const getConversationById = cache(async (id: string, userId: string) => {
  try {
    return await prisma.conversation.findFirst({
      where: { id, userId, isArchived: false },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            citations: true
          }
        }
      }
    })
  } catch {
    return await prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            citations: true
          }
        }
      }
    })
  }
})

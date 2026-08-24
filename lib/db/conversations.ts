import { prisma } from '@/lib/prisma'
import { cache } from 'react'

/**
 * Obtiene las conversaciones recientes de un usuario (para Server Components)
 */
export const getUserConversations = cache(async (userId: string) => {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { messages: true },
      },
    },
  })
})

/**
 * Obtiene una conversación específica con sus mensajes y citas RAG
 */
export const getConversationById = cache(async (id: string, userId: string) => {
  return prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          citations: true,
        },
      },
    },
  })
})

'use server'

import { prisma, Role } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * Obtiene una conversación por su ID para inspección de administrador
 */
export async function getAdminConversationAction(conversationId: string) {
  await requireRole(Role.ADMIN)

  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('ID de conversación inválido.')
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId.trim() },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          citations: true,
        },
      },
    },
  })

  if (!conversation) {
    throw new Error(`No se encontró ninguna conversación con el ID "${conversationId}".`)
  }

  return conversation
}

/**
 * Obtiene la lista de conversaciones recientes en todo el sistema para la vista administrativa
 */
export async function getRecentAdminConversationsAction() {
  await requireRole(Role.ADMIN)

  const conversations = await prisma.conversation.findMany({
    take: 35,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: { messages: true },
      },
    },
  })

  return conversations
}

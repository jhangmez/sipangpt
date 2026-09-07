'use server'

import { prisma, Role } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * Obtiene una conversación por su ID para inspección de administrador, incluyendo citas y feedbacks
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
          feedbacks: {
            select: {
              id: true,
              rating: true,
              comment: true,
              reasons: true,
              createdAt: true,
            },
          },
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
 * Obtiene la lista de conversaciones recientes con soporte de filtrado por calificaciones bajas (⭐ 1-2) y feedback
 */
export async function getRecentAdminConversationsAction(
  filter: 'all' | 'low_rating' | 'with_feedback' = 'all'
) {
  await requireRole(Role.ADMIN)

  const whereClause: Record<string, unknown> = {}

  if (filter === 'low_rating') {
    whereClause.messages = {
      some: {
        feedbacks: {
          some: {
            rating: { lte: 2 },
          },
        },
      },
    }
  } else if (filter === 'with_feedback') {
    whereClause.messages = {
      some: {
        feedbacks: {
          some: {},
        },
      },
    }
  }

  const conversations = await prisma.conversation.findMany({
    where: whereClause,
    take: 40,
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
      messages: {
        where: {
          feedbacks: {
            some: {},
          },
        },
        select: {
          feedbacks: {
            select: {
              rating: true,
              comment: true,
              reasons: true,
            },
          },
        },
      },
    },
  })

  return conversations.map((c) => {
    const allFeedbacks = c.messages.flatMap((m) => m.feedbacks)
    const minRating =
      allFeedbacks.length > 0
        ? Math.min(...allFeedbacks.map((f) => f.rating))
        : null
    const allReasons = Array.from(
      new Set(allFeedbacks.flatMap((f) => f.reasons))
    )

    return {
      id: c.id,
      title: c.title,
      isArchived: c.isArchived,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      user: c.user,
      _count: c._count,
      minRating,
      feedbacksCount: allFeedbacks.length,
      latestFeedbackReasons: allReasons,
    }
  })
}

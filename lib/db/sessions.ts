import { prisma } from '@/lib/prisma'
import { cache } from 'react'

/**
 * Obtiene todas las sesiones activas de un usuario específico
 */
export const getUserSessions = cache(async (userId: string) => {
  return prisma.session.findMany({
    where: {
      userId,
      expires: { gt: new Date() },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
        },
      },
    },
  })
})

/**
 * Obtiene todas las sesiones activas del sistema (para administradores)
 */
export const getAllSessions = cache(async () => {
  return prisma.session.findMany({
    where: {
      expires: { gt: new Date() },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
        },
      },
    },
  })
})

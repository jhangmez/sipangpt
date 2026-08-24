'use server'

import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getUserSettingsData() {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  const [dbUser, usage, messageCount, totalConversations] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.userUsage.findUnique({
      where: { userId: user.id },
    }),
    prisma.message.count({
      where: {
        conversation: {
          userId: user.id,
        },
      },
    }),
    prisma.conversation.count({
      where: { userId: user.id },
    }),
  ])

  return {
    user: dbUser,
    usage: usage || {
      dailyTokens: 0,
      totalTokens: 0,
      resetAt: new Date(),
    },
    messageCount,
    totalConversations,
  }
}

export async function updateUserProfile(data: {
  firstName?: string
  lastName?: string
  name?: string
}) {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  const fullName =
    data.firstName && data.lastName
      ? `${data.firstName.trim()} ${data.lastName.trim()}`
      : data.name?.trim() || user.name

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: data.firstName?.trim() || null,
      lastName: data.lastName?.trim() || null,
      name: fullName,
    },
  })

  revalidatePath('/configuraciones/usuario')
  revalidatePath('/chat')
  return { success: true, user: updated }
}

export async function getUserMemories() {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  return prisma.userMemory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
}

export async function toggleUserMemory(memoryId: string, isActive: boolean) {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  const memory = await prisma.userMemory.findFirst({
    where: { id: memoryId, userId: user.id },
  })
  if (!memory) throw new Error('Recuerdo no encontrado')

  const updated = await prisma.userMemory.update({
    where: { id: memoryId },
    data: { isActive },
  })

  revalidatePath('/configuraciones/memorias')
  return { success: true, memory: updated }
}

export async function deleteUserMemory(memoryId: string) {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  const memory = await prisma.userMemory.findFirst({
    where: { id: memoryId, userId: user.id },
  })
  if (!memory) throw new Error('Recuerdo no encontrado')

  await prisma.userMemory.delete({
    where: { id: memoryId },
  })

  revalidatePath('/configuraciones/memorias')
  return { success: true }
}

export async function createUserMemory(fact: string, category: string = 'general') {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  if (!fact.trim()) throw new Error('El recuerdo no puede estar vacío')

  const memory = await prisma.userMemory.create({
    data: {
      userId: user.id,
      fact: fact.trim(),
      category: category.trim(),
      isActive: true,
    },
  })

  revalidatePath('/configuraciones/memorias')
  return { success: true, memory }
}

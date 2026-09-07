'use server'

import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { CACHE_PATHS } from '@/constants'
import {
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
} from '@/lib/auth/password'
import crypto from 'crypto'

export async function getUserSettingsData() {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  const [dbUser, usage, messageCount, totalConversations, systemSetting] =
    await Promise.all([
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
        emailVerified: true,
        password: true,
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
    prisma.systemSetting
      .findUnique({
        where: { id: 'global_config' },
      })
      .catch(() => null),
  ])

  const now = new Date()
  let currentDailyTokens = usage?.dailyTokens || 0
  if (usage?.resetAt) {
    const resetAt = new Date(usage.resetAt)
    const isPast24h = now.getTime() - resetAt.getTime() >= 24 * 60 * 60 * 1000
    const isCalendarDayDiff =
      now.getUTCFullYear() !== resetAt.getUTCFullYear() ||
      now.getUTCMonth() !== resetAt.getUTCMonth() ||
      now.getUTCDate() !== resetAt.getUTCDate()

    if (isPast24h || isCalendarDayDiff) {
      currentDailyTokens = 0
    }
  }

  const dailyLimit = systemSetting?.maxDailyTokensPerUser ?? 50000

  return {
    user: dbUser
      ? {
          id: dbUser.id,
          name: dbUser.name,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          email: dbUser.email,
          image: dbUser.image,
          role: dbUser.role,
          emailVerified: dbUser.emailVerified,
          hasPassword: !!dbUser.password,
          createdAt: dbUser.createdAt,
        }
      : null,
    usage: usage
      ? {
          ...usage,
          dailyTokens: currentDailyTokens,
          dailyLimit,
        }
      : {
          id: 'temp',
          userId: user.id,
          dailyTokens: 0,
          totalTokens: 0,
          lastRequestAt: null,
          resetAt: now,
          dailyLimit,
        },
    dailyLimit,
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

  revalidatePath(CACHE_PATHS.CONFIG_USUARIO)
  revalidatePath(CACHE_PATHS.CHAT)
  return { success: true, user: updated }
}

export async function setPasswordAction(newPassword: string) {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  })

  if (dbUser?.password) {
    throw new Error('Ya tienes una contraseña establecida. Utiliza la opción "Cambiar Contraseña".')
  }

  const policy = validatePasswordPolicy(newPassword)
  if (!policy.isValid) {
    throw new Error(policy.message || 'La contraseña no cumple con los requisitos de seguridad.')
  }

  const hashedPassword = hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  revalidatePath(CACHE_PATHS.CONFIG_USUARIO)
  return { success: true, message: 'Contraseña establecida exitosamente.' }
}

export async function changePasswordAction(currentPassword: string, newPassword: string) {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  })

  if (!dbUser?.password) {
    throw new Error('No tienes una contraseña previa. Utiliza "Establecer Contraseña".')
  }

  const isValidCurrent = verifyPassword(currentPassword, dbUser.password)
  if (!isValidCurrent) {
    throw new Error('La contraseña actual ingresada es incorrecta.')
  }

  const policy = validatePasswordPolicy(newPassword)
  if (!policy.isValid) {
    throw new Error(policy.message || 'La nueva contraseña no cumple con los requisitos de seguridad.')
  }

  const hashedPassword = hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  revalidatePath(CACHE_PATHS.CONFIG_USUARIO)
  return { success: true, message: 'Contraseña actualizada con éxito.' }
}

export async function sendVerificationEmailAction() {
  const user = await getAuthenticatedUser()
  if (!user?.id || !user.email) throw new Error('No autenticado')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { emailVerified: true, email: true },
  })

  if (dbUser?.emailVerified) {
    return { success: true, message: 'Tu correo ya se encuentra verificado.', isAlreadyVerified: true }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

  await prisma.verificationToken.upsert({
    where: {
      identifier_token: {
        identifier: dbUser?.email || user.email,
        token,
      },
    },
    create: {
      identifier: dbUser?.email || user.email,
      token,
      expires,
    },
    update: {
      expires,
    },
  })

  // Simulación de envío de correo institucional con enlace
  const verificationLink = `/configuraciones/usuario?verify_token=${token}`

  return {
    success: true,
    message: 'Se ha enviado un enlace de validación a tu bandeja de entrada.',
    verificationLink,
  }
}

export async function verifyEmailWithTokenAction(token: string) {
  const user = await getAuthenticatedUser()
  if (!user?.id || !user.email) throw new Error('No autenticado')

  const record = await prisma.verificationToken.findFirst({
    where: {
      token,
      identifier: user.email,
      expires: { gt: new Date() },
    },
  })

  if (!record) {
    throw new Error('El enlace de verificación es inválido o ha expirado.')
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    }),
  ])

  revalidatePath(CACHE_PATHS.CONFIG_USUARIO)
  return { success: true, message: '¡Correo electrónico verificado exitosamente!' }
}

export async function getUserMemories() {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  return prisma.userMemory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
}

export async function toggleUserMemory(id: string, isActive: boolean) {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  await prisma.userMemory.update({
    where: { id, userId: user.id },
    data: { isActive },
  })

  revalidatePath(CACHE_PATHS.CONFIG_MEMORIAS)
  return { success: true }
}

export async function deleteUserMemory(id: string) {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  await prisma.userMemory.delete({
    where: { id, userId: user.id },
  })

  revalidatePath(CACHE_PATHS.CONFIG_MEMORIAS)
  return { success: true }
}

export async function createUserMemory(fact: string, category?: string) {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')

  if (!fact.trim()) {
    throw new Error('El contenido de la memoria no puede estar vacío.')
  }

  const count = await prisma.userMemory.count({
    where: { userId: user.id },
  })

  if (count >= 50) {
    throw new Error('Has alcanzado el límite máximo de 50 memorias activas.')
  }

  const memory = await prisma.userMemory.create({
    data: {
      userId: user.id,
      fact: fact.trim(),
      category: category?.trim() || null,
      isActive: true,
    },
  })

  revalidatePath(CACHE_PATHS.CONFIG_MEMORIAS)
  return { success: true, memory }
}

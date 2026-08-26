'use server'

import { prisma, Role } from '@/lib/prisma'
import { requireRole, getCurrentUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { isInitialAdminEmail } from '@/constants/admin'
import { CACHE_PATHS, INVITATION_STATUSES } from '@/constants'

export async function getAdministratorsData() {
  await requireRole(Role.ADMIN)

  const [admins, invitations] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.ADMIN },
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
      orderBy: { createdAt: 'asc' },
    }),
    prisma.adminInvitation.findMany({
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { admins, invitations }
}

export async function createAdminInvitation(email: string, daysValid: number = 7) {
  const currentUser = await requireRole(Role.ADMIN)
  const cleanEmail = email.trim().toLowerCase()

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Ingresa un correo electrónico válido')
  }

  // Verificar si ya es admin
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  })

  if (existingUser?.role === Role.ADMIN) {
    throw new Error('Este usuario ya cuenta con el rol de Administrador.')
  }

  // Generar token criptográfico único
  const token = crypto.randomUUID().replace(/-/g, '')
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000)

  // Crear o actualizar invitación pendiente
  const invitation = await prisma.adminInvitation.upsert({
    where: { email: cleanEmail },
    create: {
      email: cleanEmail,
      token,
      role: Role.ADMIN,
      status: 'PENDING',
      invitedById: currentUser.id,
      expiresAt,
    },
    update: {
      token,
      role: Role.ADMIN,
      status: 'PENDING',
      invitedById: currentUser.id,
      expiresAt,
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_ADMINISTRADORES)
  return { success: true, invitation }
}

export async function revokeAdminInvitation(invitationId: string) {
  await requireRole(Role.ADMIN)

  await prisma.adminInvitation.update({
    where: { id: invitationId },
    data: { status: 'REVOKED' },
  })

  revalidatePath(CACHE_PATHS.ADMIN_ADMINISTRADORES)
  return { success: true }
}

export async function removeAdminRole(userId: string) {
  const currentUser = await requireRole(Role.ADMIN)

  if (currentUser.id === userId) {
    throw new Error('No puedes revocar tus propios privilegios de administrador.')
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (targetUser && isInitialAdminEmail(targetUser.email)) {
    throw new Error('No se puede revocar privilegios al Administrador Principal del sistema.')
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: Role.USER },
  })

  revalidatePath(CACHE_PATHS.ADMIN_ADMINISTRADORES)
  return { success: true }
}

export async function acceptAdminInvitation(token: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.email) {
    throw new Error('Debes iniciar sesión para aceptar una invitación.')
  }

  const invitation = await prisma.adminInvitation.findUnique({
    where: { token },
  })

  if (!invitation) {
    throw new Error('La invitación no existe o el enlace es inválido.')
  }

  if (invitation.status !== 'PENDING') {
    throw new Error(`Esta invitación ya ha sido ${invitation.status === 'ACCEPTED' ? 'aceptada' : 'cancelada'}.`)
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    })
    throw new Error('Esta invitación ha expirado. Solicita un nuevo enlace al administrador.')
  }

  if (invitation.email.toLowerCase() !== currentUser.email.toLowerCase()) {
    throw new Error(
      `Esta invitación fue emitida para el correo ${invitation.email}. Has iniciado sesión como ${currentUser.email}.`
    )
  }

  // Actualizar rol del usuario y estado de la invitación
  await prisma.$transaction([
    prisma.user.update({
      where: { id: currentUser.id },
      data: { role: Role.ADMIN },
    }),
    prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    }),
  ])

  revalidatePath(CACHE_PATHS.ADMIN_DASHBOARD)
  revalidatePath(CACHE_PATHS.ADMIN_ADMINISTRADORES)
  return { success: true }
}

'use server'

import { prisma, Role } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

/**
 * Server Action para crear una nueva pregunta sugerida
 */
export async function createQuestionAction(formData: FormData) {
  const admin = await requireRole(Role.ADMIN)

  const text = formData.get('text')?.toString().trim()
  const icon = formData.get('icon')?.toString().trim() || '📋'
  const category = formData.get('category')?.toString().trim() || 'general'
  const order = parseInt(formData.get('order')?.toString() || '0', 10)

  if (!text) {
    throw new Error('El contenido de la pregunta es requerido.')
  }

  await prisma.pregunta.create({
    data: {
      text,
      icon,
      category,
      order,
      isActive: true,
      createdById: admin.id,
    },
  })

  revalidatePath('/admin/questions')
  revalidatePath('/chat')
}

/**
 * Server Action para actualizar una pregunta sugerida existente
 */
export async function updateQuestionAction(formData: FormData) {
  await requireRole(Role.ADMIN)

  const id = formData.get('id')?.toString()
  const text = formData.get('text')?.toString().trim()
  const icon = formData.get('icon')?.toString().trim() || '📋'
  const category = formData.get('category')?.toString().trim() || 'general'
  const order = parseInt(formData.get('order')?.toString() || '0', 10)

  if (!id || !text) {
    throw new Error('Datos incompletos para actualizar la pregunta.')
  }

  await prisma.pregunta.update({
    where: { id },
    data: {
      text,
      icon,
      category,
      order,
    },
  })

  revalidatePath('/admin/questions')
  revalidatePath('/chat')
}

/**
 * Server Action para alternar estado activo/inactivo de una pregunta
 */
export async function toggleQuestionActiveAction(id: string, isActive: boolean) {
  await requireRole(Role.ADMIN)

  await prisma.pregunta.update({
    where: { id },
    data: { isActive },
  })

  revalidatePath('/admin/questions')
  revalidatePath('/chat')
}

/**
 * Server Action para eliminar una pregunta sugerida
 */
export async function deleteQuestionAction(id: string) {
  await requireRole(Role.ADMIN)

  await prisma.pregunta.delete({
    where: { id },
  })

  revalidatePath('/admin/questions')
  revalidatePath('/chat')
}

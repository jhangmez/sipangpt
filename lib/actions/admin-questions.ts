'use server'

import { prisma, Role } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { CACHE_PATHS } from '@/constants'

export async function getAllQuestionsWithTopics() {
  await requireRole(Role.ADMIN)

  return prisma.pregunta.findMany({
    include: {
      categoryRel: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      subcategoryRel: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  })
}

export async function createQuestionAction(formData: FormData) {
  const admin = await requireRole(Role.ADMIN)

  const text = formData.get('text')?.toString().trim()
  const icon = formData.get('icon')?.toString().trim() || '📋'
  const category = formData.get('category')?.toString().trim() || 'general'
  const categoryId = formData.get('categoryId')?.toString().trim() || null
  const subcategoryId = formData.get('subcategoryId')?.toString().trim() || null
  const order = parseInt(formData.get('order')?.toString() || '0', 10)

  if (!text) {
    throw new Error('El contenido de la pregunta es requerido.')
  }

  await prisma.pregunta.create({
    data: {
      text,
      icon,
      category,
      categoryId,
      subcategoryId,
      order,
      isActive: true,
      createdById: admin.id,
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_QUESTIONS)
  revalidatePath(CACHE_PATHS.CHAT)
}

export async function createQuestionDirect(data: {
  text: string
  icon: string
  category?: string
  categoryId?: string | null
  subcategoryId?: string | null
  order?: number
}) {
  const admin = await requireRole(Role.ADMIN)

  if (!data.text.trim()) {
    throw new Error('El texto de la pregunta es obligatorio.')
  }

  const count = await prisma.pregunta.count()

  const question = await prisma.pregunta.create({
    data: {
      text: data.text.trim(),
      icon: data.icon || '📋',
      category: data.category || 'general',
      categoryId: data.categoryId || null,
      subcategoryId: data.subcategoryId || null,
      order: data.order !== undefined ? data.order : count,
      isActive: true,
      createdById: admin.id,
    },
    include: {
      categoryRel: {
        select: { id: true, name: true, code: true },
      },
      subcategoryRel: {
        select: { id: true, name: true, code: true },
      },
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_QUESTIONS)
  revalidatePath(CACHE_PATHS.CHAT)
  return { success: true, question }
}

export async function updateQuestionAction(data: {
  id: string
  text: string
  icon: string
  category?: string
  categoryId?: string | null
  subcategoryId?: string | null
  order: number
}) {
  await requireRole(Role.ADMIN)

  if (!data.id || !data.text.trim()) {
    throw new Error('Datos incompletos para actualizar la pregunta.')
  }

  const question = await prisma.pregunta.update({
    where: { id: data.id },
    data: {
      text: data.text.trim(),
      icon: data.icon || '📋',
      category: data.category || 'general',
      categoryId: data.categoryId || null,
      subcategoryId: data.subcategoryId || null,
      order: data.order,
    },
    include: {
      categoryRel: {
        select: { id: true, name: true, code: true },
      },
      subcategoryRel: {
        select: { id: true, name: true, code: true },
      },
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_QUESTIONS)
  revalidatePath(CACHE_PATHS.CHAT)
  return { success: true, question }
}

export async function toggleQuestionActiveAction(id: string, isActive: boolean) {
  await requireRole(Role.ADMIN)

  const question = await prisma.pregunta.update({
    where: { id },
    data: { isActive },
  })

  revalidatePath(CACHE_PATHS.ADMIN_QUESTIONS)
  revalidatePath(CACHE_PATHS.CHAT)
  return { success: true, question }
}

export async function deleteQuestionAction(id: string) {
  await requireRole(Role.ADMIN)

  await prisma.pregunta.delete({
    where: { id },
  })

  revalidatePath(CACHE_PATHS.ADMIN_QUESTIONS)
  revalidatePath(CACHE_PATHS.CHAT)
  return { success: true }
}

export async function moveQuestionOrderAction(id: string, direction: 'up' | 'down') {
  await requireRole(Role.ADMIN)

  const allQuestions = await prisma.pregunta.findMany({
    orderBy: { order: 'asc' },
  })

  const index = allQuestions.findIndex((q) => q.id === id)
  if (index === -1) return { success: false }

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= allQuestions.length) {
    return { success: false }
  }

  const currentQuestion = allQuestions[index]
  const targetQuestion = allQuestions[targetIndex]

  // Intercambiar órdenes
  await prisma.$transaction([
    prisma.pregunta.update({
      where: { id: currentQuestion.id },
      data: { order: targetQuestion.order },
    }),
    prisma.pregunta.update({
      where: { id: targetQuestion.id },
      data: { order: currentQuestion.order },
    }),
  ])

  revalidatePath(CACHE_PATHS.ADMIN_QUESTIONS)
  revalidatePath(CACHE_PATHS.CHAT)
  return { success: true }
}

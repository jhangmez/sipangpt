'use server'

import { prisma, Role } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { INITIAL_TOPIC_CATEGORIES, CACHE_PATHS } from '@/constants'

export async function getTopicCategoriesData() {
  await requireRole(Role.ADMIN)

  const count = await prisma.topicCategory.count()

  // Auto-inicialización garantizada si la base de datos no tiene categorías
  if (count === 0) {
    for (const cat of INITIAL_TOPIC_CATEGORIES) {
      const createdCat = await prisma.topicCategory.upsert({
        where: { code: cat.code },
        create: {
          name: cat.name,
          code: cat.code,
          description: cat.description,
          order: cat.order,
        },
        update: {},
      })

      for (const sub of cat.subcategories) {
        await prisma.topicSubcategory.upsert({
          where: {
            categoryId_code: {
              categoryId: createdCat.id,
              code: sub.code,
            },
          },
          create: {
            categoryId: createdCat.id,
            name: sub.name,
            code: sub.code,
            description: sub.description,
          },
          update: {},
        })
      }
    }
  }

  const categories = await prisma.topicCategory.findMany({
    include: {
      subcategories: {
        include: {
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { name: 'asc' },
      },
      _count: {
        select: { documents: true, messages: true },
      },
    },
    orderBy: { order: 'asc' },
  })

  return categories
}

export async function createTopicCategoryAction(data: {
  name: string
  code: string
  description?: string
  order?: number
}) {
  await requireRole(Role.ADMIN)

  const name = data.name.trim()
  const code = data.code.trim().toUpperCase().replace(/\s+/g, '_')

  if (!name || !code) {
    throw new Error('El nombre y el código de la categoría son obligatorios.')
  }

  const existingCode = await prisma.topicCategory.findUnique({
    where: { code },
  })

  if (existingCode) {
    throw new Error(`El código "${code}" ya está en uso. Elige uno diferente.`)
  }

  const category = await prisma.topicCategory.create({
    data: {
      name,
      code,
      description: data.description?.trim() || null,
      order: data.order ?? 0,
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_CATEGORIES)
  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true, category }
}

export async function updateTopicCategoryAction(data: {
  id: string
  name: string
  code: string
  description?: string
  order?: number
}) {
  await requireRole(Role.ADMIN)

  const name = data.name.trim()
  const code = data.code.trim().toUpperCase().replace(/\s+/g, '_')

  if (!data.id || !name || !code) {
    throw new Error('Datos incompletos para actualizar la categoría.')
  }

  const category = await prisma.topicCategory.update({
    where: { id: data.id },
    data: {
      name,
      code,
      description: data.description?.trim() || null,
      order: data.order,
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_CATEGORIES)
  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true, category }
}

export async function deleteTopicCategoryAction(id: string) {
  await requireRole(Role.ADMIN)

  await prisma.topicCategory.delete({
    where: { id },
  })

  revalidatePath(CACHE_PATHS.ADMIN_CATEGORIES)
  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true }
}

export async function createTopicSubcategoryAction(data: {
  categoryId: string
  name: string
  code: string
  description?: string
}) {
  await requireRole(Role.ADMIN)

  const name = data.name.trim()
  const code = data.code.trim().toUpperCase().replace(/\s+/g, '_')

  if (!data.categoryId || !name || !code) {
    throw new Error('Datos obligatorios incompletos para la subcategoría.')
  }

  const subcategory = await prisma.topicSubcategory.create({
    data: {
      categoryId: data.categoryId,
      name,
      code,
      description: data.description?.trim() || null,
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_CATEGORIES)
  return { success: true, subcategory }
}

export async function updateTopicSubcategoryAction(data: {
  id: string
  name: string
  code: string
  description?: string
}) {
  await requireRole(Role.ADMIN)

  const name = data.name.trim()
  const code = data.code.trim().toUpperCase().replace(/\s+/g, '_')

  if (!data.id || !name || !code) {
    throw new Error('Datos incompletos para actualizar la subcategoría.')
  }

  const subcategory = await prisma.topicSubcategory.update({
    where: { id: data.id },
    data: {
      name,
      code,
      description: data.description?.trim() || null,
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_CATEGORIES)
  return { success: true, subcategory }
}

export async function deleteTopicSubcategoryAction(id: string) {
  await requireRole(Role.ADMIN)

  await prisma.topicSubcategory.delete({
    where: { id },
  })

  revalidatePath(CACHE_PATHS.ADMIN_CATEGORIES)
  return { success: true }
}

export async function seedInitialTopicCategoriesAction() {
  await requireRole(Role.ADMIN)

  let createdCategoriesCount = 0
  let createdSubcategoriesCount = 0

  for (const cat of INITIAL_TOPIC_CATEGORIES) {
    const upsertedCategory = await prisma.topicCategory.upsert({
      where: { code: cat.code },
      create: {
        name: cat.name,
        code: cat.code,
        description: cat.description,
        order: cat.order,
      },
      update: {
        name: cat.name,
        description: cat.description,
        order: cat.order,
      },
    })
    createdCategoriesCount++

    for (const sub of cat.subcategories) {
      await prisma.topicSubcategory.upsert({
        where: {
          categoryId_code: {
            categoryId: upsertedCategory.id,
            code: sub.code,
          },
        },
        create: {
          categoryId: upsertedCategory.id,
          name: sub.name,
          code: sub.code,
          description: sub.description,
        },
        update: {
          name: sub.name,
          description: sub.description,
        },
      })
      createdSubcategoriesCount++
    }
  }

  revalidatePath(CACHE_PATHS.ADMIN_CATEGORIES)
  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return {
    success: true,
    createdCategoriesCount,
    createdSubcategoriesCount,
  }
}

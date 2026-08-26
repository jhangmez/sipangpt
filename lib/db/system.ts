import { prisma, type ModelStatus, type ModelProvider } from '@/lib/prisma'
import { SYSTEM_MODELS } from '@/constants/models'
import { INITIAL_QUESTIONS } from '@/constants/questions'
import { cache } from 'react'

/**
 * Obtiene los modelos de IA activos y configurados en el sistema.
 * Si la base de datos no tiene modelos iniciales, los siembra automáticamente.
 */
export const getActiveAIModels = cache(async () => {
  let models = await prisma.aIModelConfig.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
  })

  if (models.length === 0) {
    await seedDefaultModels()
    models = await prisma.aIModelConfig.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    })
  }

  return models
})

/**
 * Obtiene todos los modelos de IA (incluso inactivos) para el panel de administración.
 * No usa `cache` para garantizar datos frescos en cada petición de la página admin.
 */
export async function getAllAIModels() {
  const models = await prisma.aIModelConfig.findMany({
    orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
  })

  // Si no hay modelos sembrados aún, hacemos la siembra inicial
  if (models.length === 0) {
    await seedDefaultModels()
    return prisma.aIModelConfig.findMany({
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    })
  }

  return models
}

/**
 * Siembra los modelos por defecto al primer arranque del sistema
 */
async function seedDefaultModels() {
  for (let i = 0; i < SYSTEM_MODELS.length; i++) {
    const m = SYSTEM_MODELS[i]
    const existing = await prisma.aIModelConfig.findFirst({
      where: { modelCode: m.modelCode },
    })
    if (!existing) {
      await prisma.aIModelConfig.create({
        data: {
          name: m.name,
          modelCode: m.modelCode,
          provider: m.provider,
          description: m.description,
          status: m.status,
          latencyMs: m.latencyMs,
          isDefault: m.isDefault,
          inputPricePerMillion: m.inputPricePerMillion ?? 0.0,
          outputPricePerMillion: m.outputPricePerMillion ?? 0.0,
          order: i,
          isActive: true,
        },
      })
    }
  }
}

/**
 * Obtiene las preguntas sugeridas dinámicas activas para los usuarios
 */
export const getActiveSuggestedQuestions = cache(async () => {
  let questions = await prisma.pregunta.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })

  if (questions.length === 0) {
    for (let i = 0; i < INITIAL_QUESTIONS.length; i++) {
      const q = INITIAL_QUESTIONS[i]
      await prisma.pregunta.create({
        data: {
          text: q.text,
          icon: q.icon,
          category: q.category,
          order: i,
          isActive: true,
        },
      })
    }
    questions = await prisma.pregunta.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  }

  return questions
})

/**
 * Obtiene todas las preguntas para el panel de administración
 */
export const getAllSuggestedQuestions = cache(async () => {
  return prisma.pregunta.findMany({
    orderBy: { order: 'asc' },
    include: {
      creadoPor: {
        select: { id: true, name: true, email: true },
      },
    },
  })
})

/**
 * Obtiene la configuración general del sistema
 */
export const getSystemSettings = cache(async () => {
  let settings = await prisma.systemSetting.findUnique({
    where: { id: 'global_config' },
  })

  if (!settings) {
    settings = await prisma.systemSetting.create({
      data: { id: 'global_config' },
    })
  }

  return settings
})

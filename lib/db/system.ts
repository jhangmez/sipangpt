import { prisma, type ModelStatus, type ModelProvider } from '@/lib/prisma'
import { SYSTEM_MODELS } from '@/constants/models'
import { INITIAL_QUESTIONS } from '@/constants/questions'
import { cache } from 'react'

/**
 * Obtiene los modelos de IA activos y configurados en el sistema.
 * Si la base de datos no tiene modelos iniciales o faltan modelos, siembra y sincroniza automáticamente.
 */
export const getActiveAIModels = cache(async () => {
  await syncDefaultSystemModels()

  return prisma.aIModelConfig.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
  })
})

/**
 * Obtiene todos los modelos de IA (incluso inactivos) para el panel de administración
 */
export const getAllAIModels = cache(async () => {
  await syncDefaultSystemModels()

  return prisma.aIModelConfig.findMany({
    orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
  })
})

/**
 * Sincroniza y siembra el catálogo de modelos oficiales con sus precios por millón de tokens
 */
async function syncDefaultSystemModels() {
  try {
    for (let i = 0; i < SYSTEM_MODELS.length; i++) {
      const m = SYSTEM_MODELS[i]
      const existing = await prisma.aIModelConfig.findFirst({
        where: {
          OR: [{ modelCode: m.modelCode }, { name: m.name }],
        },
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
      } else if (
        (existing.inputPricePerMillion === 0 && existing.outputPricePerMillion === 0) ||
        !existing.description
      ) {
        // Actualizar tarifas referenciales oficiales si no tenían precio asignado
        await prisma.aIModelConfig.update({
          where: { id: existing.id },
          data: {
            inputPricePerMillion: m.inputPricePerMillion ?? existing.inputPricePerMillion,
            outputPricePerMillion: m.outputPricePerMillion ?? existing.outputPricePerMillion,
            description: existing.description || m.description,
          },
        })
      }
    }
  } catch (err) {
    console.error('[SYNC_DEFAULT_MODELS_ERROR]', err)
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

  // Auto-seed de preguntas si la tabla está vacía
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

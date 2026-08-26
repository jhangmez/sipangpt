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

  try {
    return await prisma.aIModelConfig.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    })
  } catch {
    const rawRows: any[] = await prisma.$queryRaw`
      SELECT * FROM "ai_model_configs"
      WHERE "is_active" = true
      ORDER BY "is_default" DESC, "order" ASC, "name" ASC
    `
    return rawRows.map((r) => ({
      ...r,
      modelCode: r.model_code,
      endpointUrl: r.endpoint_url,
      latencyMs: r.latency_ms,
      isActive: Boolean(r.is_active),
      isDefault: Boolean(r.is_default),
      maxTokens: Number(r.max_tokens) || 2048,
      temperature: Number(r.temperature) || 0.3,
      inputPricePerMillion: Number(r.input_price_per_million) || 0,
      outputPricePerMillion: Number(r.output_price_per_million) || 0,
      totalInferences: Number(r.total_inferences) || 0,
      totalTokensUsed: Number(r.total_tokens_used) || 0,
      estimatedCostUsd: Number(r.estimated_cost_usd) || 0,
    }))
  }
})

/**
 * Obtiene todos los modelos de IA (incluso inactivos) para el panel de administración
 */
export const getAllAIModels = cache(async () => {
  await syncDefaultSystemModels()

  try {
    return await prisma.aIModelConfig.findMany({
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    })
  } catch {
    const rawRows: any[] = await prisma.$queryRaw`
      SELECT * FROM "ai_model_configs"
      ORDER BY "is_default" DESC, "order" ASC, "name" ASC
    `
    return rawRows.map((r) => ({
      ...r,
      modelCode: r.model_code,
      endpointUrl: r.endpoint_url,
      latencyMs: r.latency_ms,
      isActive: Boolean(r.is_active),
      isDefault: Boolean(r.is_default),
      maxTokens: Number(r.max_tokens) || 2048,
      temperature: Number(r.temperature) || 0.3,
      inputPricePerMillion: Number(r.input_price_per_million) || 0,
      outputPricePerMillion: Number(r.output_price_per_million) || 0,
      totalInferences: Number(r.total_inferences) || 0,
      totalTokensUsed: Number(r.total_tokens_used) || 0,
      estimatedCostUsd: Number(r.estimated_cost_usd) || 0,
    }))
  }
})

/**
 * Sincroniza y siembra el catálogo de modelos oficiales con sus precios por millón de tokens
 * Utiliza queries SQL directos para evitar cualquier validación stale en memoria de Next.js dev
 */
async function syncDefaultSystemModels() {
  try {
    for (let i = 0; i < SYSTEM_MODELS.length; i++) {
      const m = SYSTEM_MODELS[i]
      const existingRows: any[] = await prisma.$queryRaw`
        SELECT "id", "input_price_per_million", "output_price_per_million", "description"
        FROM "ai_model_configs"
        WHERE "model_code" = ${m.modelCode} OR "name" = ${m.name}
        LIMIT 1
      `

      if (existingRows.length === 0) {
        const id = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        await prisma.$executeRaw`
          INSERT INTO "ai_model_configs" (
            "id", "name", "model_code", "provider", "description",
            "status", "latency_ms", "is_default", "input_price_per_million",
            "output_price_per_million", "order", "is_active", "created_at", "updated_at"
          ) VALUES (
            ${id}, ${m.name}, ${m.modelCode}, ${m.provider}::"ModelProvider", ${m.description || null},
            ${m.status || 'ONLINE'}::"ModelStatus", ${m.latencyMs || 150}, ${Boolean(m.isDefault)},
            ${m.inputPricePerMillion ?? 0.0}, ${m.outputPricePerMillion ?? 0.0}, ${i}, true, NOW(), NOW()
          )
        `
      } else {
        const existing = existingRows[0]
        const currIn = Number(existing.input_price_per_million) || 0
        const currOut = Number(existing.output_price_per_million) || 0
        const targetIn = m.inputPricePerMillion ?? 0.0
        const targetOut = m.outputPricePerMillion ?? 0.0

        if ((currIn === 0 && currOut === 0 && (targetIn > 0 || targetOut > 0)) || !existing.description) {
          await prisma.$executeRaw`
            UPDATE "ai_model_configs"
            SET 
              "input_price_per_million" = CASE WHEN "input_price_per_million" = 0 THEN ${targetIn} ELSE "input_price_per_million" END,
              "output_price_per_million" = CASE WHEN "output_price_per_million" = 0 THEN ${targetOut} ELSE "output_price_per_million" END,
              "description" = COALESCE("description", ${m.description || null}),
              "updated_at" = NOW()
            WHERE "id" = ${existing.id}
          `
        }
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

'use server'

import { prisma, ModelStatus, Role, ModelProvider, TokenUsageConcept, type AIModelConfig } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

/**
 * Server Action para actualizar el estado de salud y latencia de un modelo
 */
export async function updateModelStatusAction(
  modelId: string,
  status: ModelStatus,
  latencyMs?: number
) {
  await requireRole(Role.ADMIN)

  await prisma.aIModelConfig.update({
    where: { id: modelId },
    data: {
      status,
      latencyMs: latencyMs ?? undefined,
    },
  })

  revalidatePath('/admin/models')
  revalidatePath('/chat')
}

/**
 * Server Action para marcar un modelo como predeterminado
 */
export async function setDefaultModelAction(modelId: string) {
  await requireRole(Role.ADMIN)

  // Desmarcar todos los demás
  await prisma.aIModelConfig.updateMany({
    data: { isDefault: false },
  })

  // Establecer el nuevo default
  await prisma.aIModelConfig.update({
    where: { id: modelId },
    data: { isDefault: true, isActive: true },
  })

  revalidatePath('/admin/models')
  revalidatePath('/chat')
}

/**
 * Server Action para activar / desactivar un modelo
 */
export async function toggleModelActiveAction(modelId: string, isActive: boolean) {
  await requireRole(Role.ADMIN)

  await prisma.aIModelConfig.update({
    where: { id: modelId },
    data: {
      isActive,
      status: isActive ? ModelStatus.ONLINE : ModelStatus.DISABLED,
    },
  })

  revalidatePath('/admin/models')
  revalidatePath('/chat')
}

/**
 * Server Action para registrar un nuevo modelo en el catálogo
 */
export async function createAIModelAction(data: {
  name: string
  modelCode: string
  provider: ModelProvider
  description?: string
  endpointUrl?: string
  inputPricePerMillion?: number
  outputPricePerMillion?: number
  maxTokens?: number
  temperature?: number
  isDefault?: boolean
}) {
  await requireRole(Role.ADMIN)

  if (!data.name.trim() || !data.modelCode.trim()) {
    throw new Error('El nombre y el código del modelo son obligatorios.')
  }

  if (data.isDefault) {
    await prisma.aIModelConfig.updateMany({
      data: { isDefault: false },
    })
  }

  const inputPrice = Math.max(0, Number(data.inputPricePerMillion) || 0)
  const outputPrice = Math.max(0, Number(data.outputPricePerMillion) || 0)
  const maxTokens = Math.max(1, Number(data.maxTokens) || 2048)
  const temperature = Math.min(2.0, Math.max(0.0, Number(data.temperature) ?? 0.3))

  let model: AIModelConfig | null = null
  try {
    model = await prisma.aIModelConfig.create({
      data: {
        name: data.name.trim(),
        modelCode: data.modelCode.trim(),
        provider: data.provider,
        description: data.description?.trim() || null,
        endpointUrl: data.endpointUrl?.trim() || null,
        inputPricePerMillion: inputPrice,
        outputPricePerMillion: outputPrice,
        maxTokens: maxTokens,
        temperature: temperature,
        isDefault: Boolean(data.isDefault),
        status: ModelStatus.ONLINE,
        isActive: true,
      },
    })
  } catch (err) {
    const fallbackId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    await prisma.$executeRaw`
      INSERT INTO "ai_model_configs" (
        "id", "name", "model_code", "provider", "description", "endpoint_url",
        "input_price_per_million", "output_price_per_million", "max_tokens", "temperature",
        "is_default", "status", "is_active", "created_at", "updated_at"
      ) VALUES (
        ${fallbackId}, ${data.name.trim()}, ${data.modelCode.trim()}, ${data.provider}::"ModelProvider",
        ${data.description?.trim() || null}, ${data.endpointUrl?.trim() || null},
        ${inputPrice}, ${outputPrice}, ${maxTokens}, ${temperature},
        ${Boolean(data.isDefault)}, 'ONLINE'::"ModelStatus", true, NOW(), NOW()
      )
    `
    model = await prisma.aIModelConfig.findUnique({ where: { id: fallbackId } })
  }

  revalidatePath('/admin/models')
  revalidatePath('/chat')
  return {
    success: true,
    model: {
      ...(model || {}),
      name: data.name.trim(),
      modelCode: data.modelCode.trim(),
      provider: data.provider,
      description: data.description?.trim() || null,
      endpointUrl: data.endpointUrl?.trim() || null,
      inputPricePerMillion: inputPrice,
      outputPricePerMillion: outputPrice,
      maxTokens,
      temperature,
      isDefault: Boolean(data.isDefault),
      status: ModelStatus.ONLINE,
      isActive: true,
    },
  }
}

/**
 * Server Action para actualizar precios y parámetros técnicos de un modelo
 */
export async function updateAIModelPricingAction(
  modelId: string,
  data: {
    inputPricePerMillion: number
    outputPricePerMillion: number
    maxTokens?: number
    temperature?: number
    description?: string
  }
) {
  await requireRole(Role.ADMIN)

  const inputPrice = Math.max(0, Number(data.inputPricePerMillion) || 0)
  const outputPrice = Math.max(0, Number(data.outputPricePerMillion) || 0)
  const maxTokens = data.maxTokens ? Math.max(1, Number(data.maxTokens)) : undefined
  const temperature =
    data.temperature !== undefined
      ? Math.min(2.0, Math.max(0.0, Number(data.temperature)))
      : undefined

  const updated = await prisma.aIModelConfig.update({
    where: { id: modelId },
    data: {
      inputPricePerMillion: inputPrice,
      outputPricePerMillion: outputPrice,
      maxTokens: maxTokens,
      temperature: temperature,
      description: data.description !== undefined ? data.description.trim() : undefined,
    },
  })

  revalidatePath('/admin/models')
  revalidatePath('/chat')

  return {
    success: true,
    model: {
      ...updated,
      inputPricePerMillion: inputPrice,
      outputPricePerMillion: outputPrice,
    },
  }
}

/**
 * Server Action para eliminar un modelo de IA registrado (si no es default)
 */
export async function deleteAIModelAction(modelId: string) {
  await requireRole(Role.ADMIN)

  const model = await prisma.aIModelConfig.findUnique({ where: { id: modelId } })
  if (model?.isDefault) {
    throw new Error('No puedes eliminar el modelo que está configurado como predeterminado.')
  }

  await prisma.aIModelConfig.delete({ where: { id: modelId } })
  revalidatePath('/admin/models')
  return { success: true }
}

/**
 * Server Action para obtener analíticas agregadas de consumo de tokens y costos
 */
export async function getTokenUsageStatsAction() {
  await requireRole(Role.ADMIN)

  const [logs, count, models] = await Promise.all([
    prisma.tokenUsageLog.findMany({
      take: 60,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.tokenUsageLog.count(),
    prisma.aIModelConfig.findMany({
      select: {
        id: true,
        name: true,
        modelCode: true,
        provider: true,
        totalInferences: true,
        totalTokensUsed: true,
        estimatedCostUsd: true,
        inputPricePerMillion: true,
        outputPricePerMillion: true,
      },
      orderBy: { totalInferences: 'desc' },
    }),
  ])

  // Métricas acumuladas globales
  const totalTokens = logs.reduce((acc, l) => acc + l.totalTokens, 0)
  const totalCostUsd = logs.reduce((acc, l) => acc + l.estimatedCostUsd, 0)

  // Desglose por Concepto
  const byConcept: Record<string, { tokens: number; cost: number; count: number }> = {
    CHAT_COMPLETION: { tokens: 0, cost: 0, count: 0 },
    RAG_EMBEDDING: { tokens: 0, cost: 0, count: 0 },
    DOCUMENT_OCR_TRANSCRIPTION: { tokens: 0, cost: 0, count: 0 },
    QUERY_ANALYSIS: { tokens: 0, cost: 0, count: 0 },
    OTHER: { tokens: 0, cost: 0, count: 0 },
  }

  for (const log of logs) {
    const key = log.concept as string
    if (byConcept[key]) {
      byConcept[key].tokens += log.totalTokens
      byConcept[key].cost += log.estimatedCostUsd
      byConcept[key].count += 1
    } else {
      byConcept['OTHER'].tokens += log.totalTokens
      byConcept['OTHER'].cost += log.estimatedCostUsd
      byConcept['OTHER'].count += 1
    }
  }

  return {
    totalTokens,
    totalCostUsd,
    totalLogsCount: count,
    byConcept,
    recentLogs: logs,
    modelsStats: models,
  }
}

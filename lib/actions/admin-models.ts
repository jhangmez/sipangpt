'use server'

import { prisma, ModelStatus, Role, ModelProvider, TokenUsageConcept } from '@/lib/prisma'
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

  const model = await prisma.aIModelConfig.create({
    data: {
      name: data.name.trim(),
      modelCode: data.modelCode.trim(),
      provider: data.provider,
      description: data.description?.trim() || null,
      endpointUrl: data.endpointUrl?.trim() || null,
      inputPricePerMillion: Number(data.inputPricePerMillion) || 0,
      outputPricePerMillion: Number(data.outputPricePerMillion) || 0,
      maxTokens: Number(data.maxTokens) || 2048,
      temperature: Number(data.temperature) || 0.3,
      isDefault: Boolean(data.isDefault),
      status: ModelStatus.ONLINE,
      isActive: true,
    },
  })

  revalidatePath('/admin/models')
  revalidatePath('/chat')
  return { success: true, model }
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

  const updated = await prisma.aIModelConfig.update({
    where: { id: modelId },
    data: {
      inputPricePerMillion: Number(data.inputPricePerMillion) || 0,
      outputPricePerMillion: Number(data.outputPricePerMillion) || 0,
      maxTokens: data.maxTokens ? Number(data.maxTokens) : undefined,
      temperature: data.temperature !== undefined ? Number(data.temperature) : undefined,
      description: data.description !== undefined ? data.description.trim() : undefined,
    },
  })

  revalidatePath('/admin/models')
  return { success: true, model: updated }
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
          select: {
            name: true,
            email: true,
          },
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
    }),
  ])

  // Métricas acumuladas globales
  const totalTokens = logs.reduce((acc, l) => acc + l.totalTokens, 0)
  const totalCostUsd = logs.reduce((acc, l) => acc + l.estimatedCostUsd, 0)

  // Desglose por Concepto
  const byConcept: Record<TokenUsageConcept, { tokens: number; cost: number; count: number }> = {
    [TokenUsageConcept.CHAT_COMPLETION]: { tokens: 0, cost: 0, count: 0 },
    [TokenUsageConcept.RAG_EMBEDDING]: { tokens: 0, cost: 0, count: 0 },
    [TokenUsageConcept.DOCUMENT_OCR_TRANSCRIPTION]: { tokens: 0, cost: 0, count: 0 },
    [TokenUsageConcept.QUERY_ANALYSIS]: { tokens: 0, cost: 0, count: 0 },
    [TokenUsageConcept.OTHER]: { tokens: 0, cost: 0, count: 0 },
  }

  for (const log of logs) {
    if (byConcept[log.concept]) {
      byConcept[log.concept].tokens += log.totalTokens
      byConcept[log.concept].cost += log.estimatedCostUsd
      byConcept[log.concept].count += 1
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

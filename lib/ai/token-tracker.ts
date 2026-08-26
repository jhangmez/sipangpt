import { prisma, ModelProvider, TokenUsageConcept } from '@/lib/prisma'

// Tarifas de referencia en USD por 1 millón de tokens (1M)
export const MODEL_PRICING_RATES: Record<
  string,
  { inputPerMillion: number; outputPerMillion: number }
> = {
  'gemini-3.1-flash-lite': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-2.5-flash': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gemini-2.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },
  'gemini-flash-thinking': { inputPerMillion: 0.10, outputPerMillion: 0.40 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  'gpt-4o': { inputPerMillion: 2.50, outputPerMillion: 10.00 },
  'o3-mini': { inputPerMillion: 1.10, outputPerMillion: 4.40 },
  'claude-3-5-sonnet-latest': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'llama-3.3-70b-versatile': { inputPerMillion: 0.59, outputPerMillion: 0.79 },
  'gemini-embedding-2': { inputPerMillion: 0.02, outputPerMillion: 0.0 },
  'text-embedding-004': { inputPerMillion: 0.02, outputPerMillion: 0.0 },
}

/**
 * Calcula el costo estimado en USD de una invocación según los tokens consumidos
 */
export function calculateEstimatedCost(
  modelCode: string,
  promptTokens: number = 0,
  completionTokens: number = 0
): number {
  const cleanCode = (modelCode || '').toLowerCase().trim()
  
  // Buscar tarifa exacta o por coincidencia parcial
  let rate = MODEL_PRICING_RATES[cleanCode]
  if (!rate) {
    const matchedKey = Object.keys(MODEL_PRICING_RATES).find((key) => cleanCode.includes(key))
    rate = matchedKey ? MODEL_PRICING_RATES[matchedKey] : { inputPerMillion: 0.10, outputPerMillion: 0.40 }
  }

  const inputCost = (promptTokens * rate.inputPerMillion) / 1_000_000
  const outputCost = (completionTokens * rate.outputPerMillion) / 1_000_000

  // Redondear a 6 decimales para alta precisión
  return Number((inputCost + outputCost).toFixed(6))
}

export interface RecordTokenUsageParams {
  userId?: string | null
  conversationId?: string | null
  messageId?: string | null
  modelCode: string
  provider?: ModelProvider
  concept?: TokenUsageConcept
  promptTokens?: number
  completionTokens?: number
  latencyMs?: number
  metadata?: any
}

/**
 * Registra un log de consumo de tokens y actualiza métricas acumuladas del modelo en base de datos
 */
export async function recordTokenUsageLog({
  userId,
  conversationId,
  messageId,
  modelCode,
  provider = ModelProvider.GEMINI,
  concept = TokenUsageConcept.CHAT_COMPLETION,
  promptTokens = 0,
  completionTokens = 0,
  latencyMs,
  metadata,
}: RecordTokenUsageParams) {
  try {
    const totalTokens = promptTokens + completionTokens
    const estimatedCostUsd = calculateEstimatedCost(modelCode, promptTokens, completionTokens)

    // 1. Insertar el registro detallado en token_usage_logs
    await prisma.tokenUsageLog.create({
      data: {
        userId: userId || null,
        conversationId: conversationId || null,
        messageId: messageId || null,
        modelCode,
        provider,
        concept,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
        latencyMs: latencyMs ?? null,
        metadata: metadata ? (metadata as any) : undefined,
      },
    })

    // 2. Incrementar contadores en AIModelConfig si el modelo está registrado
    await prisma.aIModelConfig.updateMany({
      where: {
        modelCode: {
          contains: modelCode,
          mode: 'insensitive',
        },
      },
      data: {
        totalInferences: { increment: 1 },
        totalTokensUsed: { increment: totalTokens },
        estimatedCostUsd: { increment: estimatedCostUsd },
      },
    })
  } catch (err) {
    console.error('[RECORD_TOKEN_USAGE_ERROR]', err)
  }
}

import { embed, embedMany, cosineSimilarity, type EmbeddingModel } from 'ai'
import { google, openai } from '@/lib/ai/providers'
import { ModelProvider } from '@/lib/prisma'

export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-2'

/**
 * Obtiene la instancia del modelo de embeddings según el proveedor
 */
export function getEmbeddingModel(
  provider: ModelProvider | string = ModelProvider.GEMINI,
  modelCode: string = DEFAULT_EMBEDDING_MODEL
): EmbeddingModel {
  if (provider === ModelProvider.OPENAI) {
    return openai.textEmbeddingModel(modelCode || 'text-embedding-3-small')
  }

  // Por defecto usar Google Gemini Embeddings (gemini-embedding-2)
  return google.textEmbeddingModel(modelCode || DEFAULT_EMBEDDING_MODEL)
}

/**
 * Genera el embedding vectorial para un texto o consulta individual
 */
export async function generateEmbedding(
  text: string,
  modelCode: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[]> {
  const model = getEmbeddingModel(ModelProvider.GEMINI, modelCode)
  const { embedding } = await embed({
    model,
    value: text.trim(),
  })
  return embedding
}

/**
 * Genera embeddings vectoriales por lotes (batch) para múltiples fragmentos de texto
 */
export async function generateEmbeddings(
  texts: string[],
  modelCode: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[][]> {
  if (texts.length === 0) return []

  const model = getEmbeddingModel(ModelProvider.GEMINI, modelCode)
  const { embeddings } = await embedMany({
    model,
    values: texts.map((t) => t.trim()),
  })
  return embeddings
}

/**
 * Calcula la similitud de coseno entre dos vectores numéricos
 */
export function computeCosineSimilarity(
  vectorA: number[],
  vectorB: number[]
): number {
  return cosineSimilarity(vectorA, vectorB)
}

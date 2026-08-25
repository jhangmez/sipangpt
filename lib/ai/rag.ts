import { prisma } from '@/lib/prisma'
import {
  generateEmbedding,
  generateEmbeddings,
  computeCosineSimilarity,
} from '@/lib/ai/embeddings'

export interface RetrievedSource {
  chunkId?: string | null
  documentId: string
  title: string
  sourceUrl?: string | null
  pageNumber?: number | null
  snippetText: string
  relevance: number
  embeddingModel?: string
}

/**
 * Búsqueda semántica y contextual en la base de conocimiento universitaria (RAG)
 * Utiliza embeddings vectoriales con Gemini (gemini-embedding-2) y cosineSimilarity de AI SDK
 */
export async function searchKnowledgeBase(
  query: string,
  topK: number = 3,
  minScore: number = 0.50
): Promise<RetrievedSource[]> {
  try {
    const cleanQuery = query.trim()
    if (!cleanQuery) return []

    // 1. Obtener términos clave para pre-filtrar fragmentos relevantes de la base de datos
    const keywords = cleanQuery
      .toLowerCase()
      .replace(/[¿?¡!.,;:()]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)

    // 2. Buscar fragmentos candidatos en documentos indexados
    const candidateChunks = await prisma.documentChunk.findMany({
      where: {
        document: {
          status: 'INDEXED',
        },
        ...(keywords.length > 0
          ? {
              OR: keywords.map((word) => ({
                content: {
                  contains: word,
                  mode: 'insensitive' as const,
                },
              })),
            }
          : {}),
      },
      take: Math.max(topK * 4, 12),
      include: {
        document: {
          select: {
            id: true,
            title: true,
            publicUrl: true,
            fileUrl: true,
          },
        },
      },
    })

    if (!candidateChunks || candidateChunks.length === 0) {
      return []
    }

    // 3. Si tenemos fragmentos candidatos, aplicar similitud semántica por embeddings (AI SDK)
    try {
      const queryEmbedding = await generateEmbedding(cleanQuery)
      const chunkTexts = candidateChunks.map((c) => c.content)
      const chunkEmbeddings = await generateEmbeddings(chunkTexts)

      const scoredResults: RetrievedSource[] = candidateChunks.map((chunk, idx) => {
        const similarity = chunkEmbeddings[idx]
          ? computeCosineSimilarity(queryEmbedding, chunkEmbeddings[idx])
          : 0.5

        return {
          chunkId: chunk.id,
          documentId: chunk.document.id,
          title: chunk.document.title,
          sourceUrl: chunk.document.publicUrl || chunk.document.fileUrl,
          pageNumber: chunk.pageNumber,
          snippetText: chunk.content.trim(),
          relevance: Number(Math.max(0, Math.min(1, similarity)).toFixed(3)),
          embeddingModel: 'gemini-embedding-2',
        }
      })

      // Ordenar por mayor similitud de coseno y filtrar por umbral configurado por el admin
      const validResults = scoredResults
        .filter((r) => r.relevance >= minScore)
        .sort((a, b) => b.relevance - a.relevance)

      return validResults.slice(0, topK)
    } catch (embErr) {
      console.warn(
        '[RAG_EMBEDDING_FALLBACK] Error al generar embeddings, usando relevancia léxica:',
        embErr
      )

      // Fallback a ranking léxico si falla la llamada de embeddings
      return candidateChunks.slice(0, topK).map((chunk, idx) => ({
        chunkId: chunk.id,
        documentId: chunk.document.id,
        title: chunk.document.title,
        sourceUrl: chunk.document.publicUrl || chunk.document.fileUrl,
        pageNumber: chunk.pageNumber,
        snippetText: chunk.content.trim(),
        relevance: Number((0.95 - idx * 0.05).toFixed(2)),
        embeddingModel: 'lexical-fallback',
      }))
    }
  } catch (error) {
    console.error('[RAG_SEARCH_ERROR]', error)
    return []
  }
}

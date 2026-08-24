import { prisma } from '@/lib/prisma'

export interface RetrievedSource {
  documentId: string
  title: string
  sourceUrl?: string | null
  pageNumber?: number | null
  snippetText: string
  relevance: number
}

/**
 * Búsqueda en la base de conocimiento universitaria (RAG)
 * Soporta búsqueda contextual por similitud o coincidencia sobre DocumentChunk & Document
 */
export async function searchKnowledgeBase(
  query: string,
  topK: number = 4
): Promise<RetrievedSource[]> {
  try {
    // 1. Obtener términos clave de la consulta
    const keywords = query
      .toLowerCase()
      .replace(/[¿?¡!.,;:()]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)

    if (keywords.length === 0) return []

    // 2. Buscar fragmentos en documentos indexados
    const chunks = await prisma.documentChunk.findMany({
      where: {
        document: {
          status: 'INDEXED',
        },
        OR: keywords.map((word) => ({
          content: {
            contains: word,
            mode: 'insensitive' as const,
          },
        })),
      },
      take: topK * 2,
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

    if (!chunks || chunks.length === 0) {
      return []
    }

    // 3. Mapear y calcular relevancia estimada
    const results: RetrievedSource[] = chunks.slice(0, topK).map((chunk, idx) => {
      return {
        documentId: chunk.document.id,
        title: chunk.document.title,
        sourceUrl: chunk.document.publicUrl || chunk.document.fileUrl,
        pageNumber: chunk.pageNumber,
        snippetText: chunk.content.trim(),
        relevance: Number((0.95 - idx * 0.05).toFixed(2)),
      }
    })

    return results
  } catch (error) {
    console.error('[RAG_SEARCH_ERROR]', error)
    return []
  }
}

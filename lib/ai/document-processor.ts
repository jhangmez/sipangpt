import { prisma } from '@/lib/prisma'

export interface TextChunk {
  content: string
  pageNumber?: number | null
  chunkIndex: number
}

/**
 * Divide texto extenso en fragmentos semánticos (chunks) con solapamiento (overlap)
 * y detección heurística de páginas o artículos
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 600,
  overlap: number = 80
): TextChunk[] {
  const clean = text.trim()
  if (!clean) return []

  const chunks: TextChunk[] = []
  
  // Dividir por párrafos primero para preservar límites semánticos naturales
  const paragraphs = clean
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  let currentChunk = ''
  let currentPage: number | null = 1
  let chunkIndex = 0

  for (const para of paragraphs) {
    // Detección de patrones de página (ej. "Página 5", "Pag. 5", "--- Página 5 ---")
    const pageMatch = para.match(/(?:página|pag\.|pág\.)\s*(\d+)/i)
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10)
    }

    if ((currentChunk + '\n\n' + para).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para
    } else {
      if (currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          pageNumber: currentPage,
          chunkIndex,
        })
        chunkIndex++
        
        // Conservar solapamiento final
        const words = currentChunk.split(/\s+/)
        const overlapText = words.slice(-Math.max(1, Math.floor(overlap / 10))).join(' ')
        currentChunk = overlapText ? `${overlapText}\n\n${para}` : para
      } else {
        // Párrafo muy largo, dividir por frases
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para]
        for (const sent of sentences) {
          if ((currentChunk + ' ' + sent).length <= chunkSize) {
            currentChunk = currentChunk ? `${currentChunk} ${sent}` : sent
          } else {
            if (currentChunk) {
              chunks.push({
                content: currentChunk.trim(),
                pageNumber: currentPage,
                chunkIndex,
              })
              chunkIndex++
            }
            currentChunk = sent
          }
        }
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      pageNumber: currentPage,
      chunkIndex,
    })
  }

  return chunks
}

/**
 * Indexa el contenido textual completo de un documento en la tabla DocumentChunk de Prisma
 */
export async function indexDocumentContent(
  documentId: string,
  rawContent: string
): Promise<{ success: boolean; chunkCount: number }> {
  const chunks = splitTextIntoChunks(rawContent, 650, 90)

  if (chunks.length === 0) {
    throw new Error('El contenido del documento está vacío o no contiene texto legible.')
  }

  // 1. Eliminar fragmentos previos del documento para re-indexación limpia
  await prisma.documentChunk.deleteMany({
    where: { documentId },
  })

  // 2. Insertar los nuevos fragmentos en Prisma
  await prisma.documentChunk.createMany({
    data: chunks.map((c) => ({
      documentId,
      chunkIndex: c.chunkIndex,
      content: c.content,
      pageNumber: c.pageNumber,
    })),
  })

  // 3. Actualizar estado del documento a INDEXED y su conteo de chunks
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: 'INDEXED',
      chunkCount: chunks.length,
      updatedAt: new Date(),
    },
  })

  return { success: true, chunkCount: chunks.length }
}

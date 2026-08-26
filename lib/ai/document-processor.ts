import { prisma, ModelProvider, TokenUsageConcept } from '@/lib/prisma'
import { generateText } from 'ai'
import { google } from '@/lib/ai/providers'
import { recordTokenUsageLog } from '@/lib/ai/token-tracker'

export interface TextChunk {
  content: string
  pageNumber?: number | null
  chunkIndex: number
}

/**
 * Transcribe y estructura cualquier documento (PDF, TXT o Markdown) a formato Markdown enriquecido
 * utilizando el modelo multimodal Gemini 2.5 Flash de Google
 */
export async function extractAndStructureToMarkdown(
  fileUrl: string,
  mimeType: string = 'application/pdf'
): Promise<string> {
  const cleanUrl = fileUrl.trim()
  if (!cleanUrl) {
    throw new Error('La URL del documento no es válida.')
  }

  // 1. Descargar el binario del documento desde UploadThing u origen
  const response = await fetch(cleanUrl)
  if (!response.ok) {
    throw new Error(`Error al descargar el archivo: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Si es un archivo de texto plano o markdown simple
  if (mimeType.includes('text/plain') || mimeType.includes('markdown') || cleanUrl.endsWith('.txt') || cleanUrl.endsWith('.md')) {
    return buffer.toString('utf-8')
  }

  // 2. Si es un PDF, transcribir y estructurar a Markdown mediante Gemini Multimodal
  try {
    const result = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Eres el transcriptor y estructurador oficial de normativas de la Universidad Señor de Sipán (USS).
Tu misión es transcribir este documento de manera completa, fiel y estructurada en formato Markdown (.md).

Reglas de Estructuración:
1. Por cada página identificada, inserta un encabezado claro con el formato: "--- Página X ---".
2. Emplea sintaxis Markdown estándar: encabezados (#, ##, ###), viñetas (-), listas numeradas y tablas GFM si existen cuadros.
3. No resumas, no omitas artículos, directivas, cronogramas, aulas ni resoluciones. Transcribe todo el texto íntegro.
4. Mantén la terminología y formalidad institucional de la USS.`,
            },
            {
              type: 'file',
              data: buffer,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    })

    // Registrar consumo de tokens por OCR / Transcripción de PDF
    await recordTokenUsageLog({
      modelCode: 'gemini-2.5-flash',
      provider: ModelProvider.GEMINI,
      concept: TokenUsageConcept.DOCUMENT_OCR_TRANSCRIPTION,
      promptTokens: result.usage?.inputTokens || 0,
      completionTokens: result.usage?.outputTokens || 0,
    })

    return result.text.trim()
  } catch (err: unknown) {
    console.error('[PDF_GEMINI_OCR_ERROR]', err)
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    throw new Error(`Fallo al transcribir el PDF con Gemini: ${msg}`)
  }
}

/**
 * Divide texto o markdown extenso en fragmentos semánticos (chunks) con solapamiento (overlap)
 * y detección heurística de páginas o artículos
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 650,
  overlap: number = 90
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
    // Detección de patrones de página (ej. "--- Página 5 ---", "Página 5", "Pag. 5")
    const pageMatch = para.match(/(?:---\s*página|página|pag\.|pág\.)\s*(\d+)/i)
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

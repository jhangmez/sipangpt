import { prisma, ModelProvider, TokenUsageConcept } from '@/lib/prisma'
import { recordTokenUsageLog } from '@/lib/ai/token-tracker'
import { DOCUMENT_TRANSCRIPTION_MODEL_CODE, DEFAULT_EMBEDDING_MODEL } from '@/constants'
import { generateEmbeddingsWithUsage } from '@/lib/ai/embeddings'
import { sanitizeMojibake, stripBase64Images } from '@/lib/utils'

export interface TextChunk {
  content: string
  pageNumber?: number | null
  chunkIndex: number
  metadata?: Record<string, unknown>
}

/**
 * Transcribe y estructura cualquier documento (PDF, TXT o Markdown) a formato Markdown enriquecido
 * utilizando el modelo multimodal Gemini oficial configurado en constantes
 */
export async function extractAndStructureToMarkdown(
  fileUrl: string,
  mimeType: string = 'application/pdf'
): Promise<string> {
  const logPrefix = `[RAG_INDEXER] [${new Date().toISOString()}]`
  const cleanUrl = fileUrl.trim()
  if (!cleanUrl) {
    console.error(`${logPrefix} ❌ URL de documento vacía o inválida.`)
    throw new Error('La URL del documento no es válida.')
  }

  console.log(`${logPrefix} 🚀 [Paso 1/3] Iniciando descarga de archivo...`)
  console.log(`${logPrefix} 🔗 URL: ${cleanUrl}`)
  console.log(`${logPrefix} 📋 MimeType esperado: ${mimeType}`)

  // 1. Descargar el binario del documento desde UploadThing u origen (timeout: 30s)
  let response: Response
  const downloadStart = Date.now()
  try {
    response = await fetch(cleanUrl, {
      signal: AbortSignal.timeout(30_000)
    })
  } catch (err: unknown) {
    const isTimeout = err instanceof DOMException && err.name === 'TimeoutError'
    console.error(`${logPrefix} ❌ [Paso 1/3] Error en fetch de archivo:`, err)
    throw new Error(
      isTimeout
        ? 'Tiempo de espera agotado al descargar el archivo desde UploadThing (>30s).'
        : `Error de red al descargar el archivo: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  if (!response.ok) {
    console.error(
      `${logPrefix} ❌ [Paso 1/3] Respuesta HTTP no exitosa: ${response.status} ${response.statusText}`
    )
    throw new Error(
      `No se pudo descargar el archivo (HTTP ${response.status} ${response.statusText}). Verifica que la URL sea accesible.`
    )
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const downloadDurationMs = Date.now() - downloadStart

  console.log(
    `${logPrefix} ✅ [Paso 1/3] Archivo descargado en ${downloadDurationMs}ms: ${buffer.byteLength} bytes (${(buffer.byteLength / 1024).toFixed(1)} KB)`
  )

  // Si es un archivo de texto plano o markdown simple
  if (
    mimeType.includes('text/plain') ||
    mimeType.includes('markdown') ||
    cleanUrl.endsWith('.txt') ||
    cleanUrl.endsWith('.md')
  ) {
    console.log(
      `${logPrefix} 📄 Archivo de texto plano detectado. Omitiendo OCR, sanitizando codificación y eliminando imágenes base64.`
    )
    const rawText = buffer.toString('utf-8')
    const sanitized = sanitizeMojibake(rawText)
    return stripBase64Images(sanitized)
  }

  // 2. Si es un PDF, transcribir y estructurar a Markdown mediante Gemini Multimodal (DOCUMENT_TRANSCRIPTION_MODEL_CODE)
  console.log(
    `${logPrefix} 🤖 [Paso 2/3] Procesando PDF con Gemini (${DOCUMENT_TRANSCRIPTION_MODEL_CODE})...`
  )
  const ocrStart = Date.now()
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || ''

  if (!apiKey) {
    console.error(
      `${logPrefix} ❌ GOOGLE_GENERATIVE_AI_API_KEY no encontrada en variables de entorno.`
    )
    throw new Error('API Key de Google no configurada en el servidor.')
  }

  const systemTranscriptionPrompt = `Analiza y extrae de manera estructurada y completa todo el contenido, normativas, capítulos, artículos, tablas, cronogramas y directivas presentes en este documento de la Universidad Señor de Sipán (USS).

Reglas de Estructuración en Markdown (.md):
1. Organiza por secciones y encabezados (#, ##, ###) según los capítulos, reglamentos o títulos del documento.
2. Si hay páginas identificadas, usa separadores tipo "--- Página X ---".
3. Si hay tablas o cronogramas, represéntalos en tablas Markdown con sintaxis GFM.
4. Extrae toda la información operativa, requisitos, procedimientos, artículos y normativas de forma detallada y fidedigna para el sistema RAG de preguntas y respuestas de la universidad.
5. Mantén la terminología y formalidad institucional de la USS.`

  let googleFileName: string | null = null
  let fileUri: string | null = null

  // 2.1 Intentar subir a Google Files API para procesamiento ultrarrápido y soporte de archivos pesados
  try {
    console.log(`${logPrefix} 📤 Subiendo binario a Google Files API...`)
    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': buffer.byteLength.toString(),
          'X-Goog-Upload-Header-Content-Type': 'application/pdf',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file: { display_name: 'Documento USS RAG' }
        }),
        signal: AbortSignal.timeout(30_000)
      }
    )

    const uploadUrl = initRes.headers.get('x-goog-upload-url')
    if (uploadUrl) {
      const uploadBinaryRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Length': buffer.byteLength.toString(),
          'X-Goog-Upload-Offset': '0',
          'X-Goog-Upload-Command': 'upload, finalize'
        },
        body: buffer,
        signal: AbortSignal.timeout(60_000)
      })

      const fileData = await uploadBinaryRes.json()
      if (fileData.file?.uri) {
        fileUri = fileData.file.uri
        googleFileName = fileData.file.name
        console.log(
          `${logPrefix} 📦 Archivo registrado en Google Files: ${fileUri}`
        )
      }
    }
  } catch (fileApiErr) {
    console.warn(
      `${logPrefix} ⚠️ No se pudo usar Google Files API, usando payload inline:`,
      fileApiErr
    )
  }

  // Preparar payload para Gemini
  const parts: Array<{ text?: string; fileData?: { mimeType: string; fileUri: string }; inlineData?: { mimeType: string; data: string } }> = [
    { text: systemTranscriptionPrompt }
  ]

  if (fileUri) {
    parts.push({
      fileData: {
        mimeType: 'application/pdf',
        fileUri
      }
    })
  } else {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: buffer.toString('base64')
      }
    })
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts
      }
    ],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.1
    }
  }

  try {
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DOCUMENT_TRANSCRIPTION_MODEL_CODE}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(180_000) // 180s para documentos pesados
      }
    )

    const data = await apiRes.json()
    const ocrDuration = Date.now() - ocrStart

    if (!apiRes.ok || data.error) {
      const errMsg =
        data.error?.message || `HTTP ${apiRes.status} ${apiRes.statusText}`
      console.error(
        `${logPrefix} ❌ [Paso 2/3] Error de Google Generative AI:`,
        errMsg
      )
      throw new Error(
        `Fallo al transcribir el PDF con Gemini (${DOCUMENT_TRANSCRIPTION_MODEL_CODE}): ${errMsg}`
      )
    }

    const candidate = data.candidates?.[0]
    const finishReason = candidate?.finishReason

    if (finishReason === 'MAX_TOKENS') {
      console.warn(
        `${logPrefix} ⚠️ [ALERTA] Gemini alcanzó el límite máximo de tokens de salida (MAX_TOKENS). El documento supera la longitud recomendada (> 50 páginas o muy denso) y su transcripción pudo haber quedado truncada. Se recomienda dividir el documento por capítulos o secciones.`
      )
    }

    const transcribedText =
      candidate?.content?.parts?.[0]?.text?.trim() || ''

    if (!transcribedText || transcribedText.length < 20) {
      console.error(
        `${logPrefix} ❌ [Paso 2/3] Gemini devolvió respuesta vacía o insuficiente (finishReason=${finishReason}):`,
        data
      )
      throw new Error(
        `El modelo no devolvió contenido legible del PDF (motivo: ${finishReason || 'sin datos'}). El archivo puede estar protegido o dañado.`
      )
    }

    console.log(
      `${logPrefix} ✅ [Paso 2/3] Transcripción completada en ${ocrDuration}ms con ${DOCUMENT_TRANSCRIPTION_MODEL_CODE}. Total caracteres: ${transcribedText.length}`
    )

    // Registrar consumo de tokens
    const inputTokens = data.usageMetadata?.promptTokenCount || 0
    const outputTokens = data.usageMetadata?.candidatesTokenCount || 0
    try {
      await recordTokenUsageLog({
        modelCode: DOCUMENT_TRANSCRIPTION_MODEL_CODE,
        provider: ModelProvider.GEMINI,
        concept: TokenUsageConcept.DOCUMENT_OCR_TRANSCRIPTION,
        promptTokens: inputTokens,
        completionTokens: outputTokens
      })
      console.log(
        `${logPrefix} 📊 Tokens registrados: input=${inputTokens}, output=${outputTokens}`
      )
    } catch (logErr) {
      console.warn(
        `${logPrefix} ⚠️ No se pudo registrar token usage log (no crítico):`,
        logErr
      )
    }

    return transcribedText
  } catch (err: unknown) {
    const isTimeout = err instanceof DOMException && err.name === 'AbortError'
    console.error(`${logPrefix} 💥 [Paso 2/3] Excepción durante transcripción:`, err)
    throw new Error(
      isTimeout
        ? `Tiempo de espera agotado al transcribir el PDF con Gemini (>180s).`
        : err instanceof Error ? err.message : 'Error desconocido al transcribir documento con Gemini.'
    )
  } finally {
    // Limpiar archivo temporal de Google Files si fue subido
    if (googleFileName) {
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/${googleFileName}?key=${apiKey}`,
        { method: 'DELETE' }
      ).catch((delErr) =>
        console.warn(`${logPrefix} ⚠️ Error limpiando archivo temporal de Google Files:`, delErr)
      )
    }
  }
}

/**
 * Extrae títulos jerárquicos institucionales (Capítulo, Artículo, Título) desde un párrafo
 */
function extractHierarchyHeaders(text: string): {
  capitulo?: string
  articulo?: string
} {
  const capMatch = text.match(/(?:^|\n)(?:#+\s*)?(?:(cap[íi]tulo|t[íi]tulo)\s+[IVXLCDM\d]+[^\n.:]*)/i)
  const artMatch = text.match(/(?:^|\n)(?:#+\s*)?(?:(art[íi]culo|art\.)\s*\d+[^\n.:]*)/i)

  return {
    capitulo: capMatch ? capMatch[0].replace(/^#+\s*/, '').trim() : undefined,
    articulo: artMatch ? artMatch[0].replace(/^#+\s*/, '').trim() : undefined,
  }
}

/**
 * Divide texto o markdown extenso en fragmentos semánticos enriquecidos (chunks) con solapamiento (overlap),
 * inyección de encabezados contextuales (Header Prepending) y extracción de metadatos estructurados.
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 650,
  overlap: number = 90,
  documentTitle: string = 'Documento Institucional USS',
  categoryCode: string = 'GENERAL'
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
  let currentCapitulo: string | null = null
  let currentArticulo: string | null = null
  let chunkIndex = 0

  // Detectar año de vigencia (ej: 2026, 2025)
  const yearMatch = text.match(/\b(202[4-9]|203[0-5])\b/)
  const anioVigencia = yearMatch ? parseInt(yearMatch[1], 10) : 2026

  const buildPrefixedChunk = (content: string): { content: string; metadata: Record<string, unknown> } => {
    const headerPrefixLines: string[] = [`[DOCUMENTO: ${documentTitle}]`]
    if (currentCapitulo) headerPrefixLines.push(`[CAPÍTULO: ${currentCapitulo}]`)
    if (currentArticulo) headerPrefixLines.push(`[ARTÍCULO: ${currentArticulo}]`)

    const headerBlock = headerPrefixLines.join('\n')
    // Evitar duplicar encabezado si ya está presente
    const finalContent = content.startsWith('[DOCUMENTO:')
      ? content
      : `${headerBlock}\n\n${content}`

    return {
      content: finalContent.trim(),
      metadata: {
        documentTitle,
        categoria: categoryCode,
        capitulo: currentCapitulo,
        articulo: currentArticulo,
        anio_vigencia: anioVigencia,
        estado: 'ACTIVO',
        pageNumber: currentPage,
      },
    }
  }

  for (const para of paragraphs) {
    // Detección de patrones de página (ej. "--- Página 5 ---", "Página 5", "Pag. 5")
    const pageMatch = para.match(/(?:---\s*página|página|pag\.|pág\.)\s*(\d+)/i)
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10)
    }

    // Rastrear jerarquía de capítulos y artículos
    const hierarchy = extractHierarchyHeaders(para)
    if (hierarchy.capitulo) currentCapitulo = hierarchy.capitulo
    if (hierarchy.articulo) currentArticulo = hierarchy.articulo

    if ((currentChunk + '\n\n' + para).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para
    } else {
      if (currentChunk.length > 0) {
        const enriched = buildPrefixedChunk(currentChunk)
        chunks.push({
          content: enriched.content,
          pageNumber: currentPage,
          chunkIndex,
          metadata: enriched.metadata,
        })
        chunkIndex++

        // Conservar solapamiento final
        const words = currentChunk.split(/\s+/)
        const overlapText = words
          .slice(-Math.max(1, Math.floor(overlap / 10)))
          .join(' ')
        currentChunk = overlapText ? `${overlapText}\n\n${para}` : para
      } else {
        // Párrafo muy largo, dividir por frases
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para]
        for (const sent of sentences) {
          if ((currentChunk + ' ' + sent).length <= chunkSize) {
            currentChunk = currentChunk ? `${currentChunk} ${sent}` : sent
          } else {
            if (currentChunk) {
              const enriched = buildPrefixedChunk(currentChunk)
              chunks.push({
                content: enriched.content,
                pageNumber: currentPage,
                chunkIndex,
                metadata: enriched.metadata,
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
    const enriched = buildPrefixedChunk(currentChunk)
    chunks.push({
      content: enriched.content,
      pageNumber: currentPage,
      chunkIndex,
      metadata: enriched.metadata,
    })
  }

  return chunks
}

/**
 * Indexa el contenido textual completo de un documento en la tabla DocumentChunk de Prisma,
 * estructurando metadatos y persistiendo vector embeddings pre-calculados (Estrategia 1 y 4).
 */
export async function indexDocumentContent(
  documentId: string,
  rawContent: string
): Promise<{ success: boolean; chunkCount: number }> {
  const logPrefix = `[RAG_INDEXER] [${new Date().toISOString()}]`
  console.log(
    `${logPrefix} ✂️ [Paso 3/3] Segmentando texto en chunks semánticos contextuales...`
  )

  // Consultar metadatos del documento desde la BD
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { category: true },
  })

  const docTitle = doc?.title || 'Reglamento Institucional USS'
  const categoryCode = doc?.category?.code || 'GENERAL'

  // Limpiar cualquier imagen base64 y normalizar codificación antes de crear chunks
  const cleanedContent = stripBase64Images(sanitizeMojibake(rawContent))

  const chunks = splitTextIntoChunks(cleanedContent, 650, 90, docTitle, categoryCode)
  console.log(
    `${logPrefix} 🧩 Chunks contextuales generados: ${chunks.length} fragmentos con Header Prepending.`
  )

  if (chunks.length === 0) {
    console.error(
      `${logPrefix} ❌ El contenido resultante no produjo ningún chunk legible.`
    )
    throw new Error(
      'El contenido del documento está vacío o no contiene texto legible.'
    )
  }

  // 1. Pre-calcular vector embeddings para todos los chunks de una sola vez
  console.log(
    `${logPrefix} 📐 Calculando embeddings vectoriales persistentes (${chunks.length} fragmentos)...`
  )
  let chunkEmbeddings: number[][] = []
  try {
    const chunkTexts = chunks.map((c) => c.content)
    const embStart = Date.now()
    const { embeddings, tokens: embTokens } = await generateEmbeddingsWithUsage(chunkTexts)
    chunkEmbeddings = embeddings
    const embDuration = Date.now() - embStart
    console.log(
      `${logPrefix} ✅ Embeddings generados exitosamente (${chunkEmbeddings.length} vectores persistidos, ${embTokens} tokens).`
    )

    // Registrar consumo de tokens de embeddings durante la ingesta documental
    await recordTokenUsageLog({
      modelCode: DEFAULT_EMBEDDING_MODEL,
      provider: ModelProvider.GEMINI,
      concept: TokenUsageConcept.RAG_EMBEDDING,
      promptTokens: embTokens,
      completionTokens: 0,
      latencyMs: embDuration,
      metadata: {
        documentId,
        totalChunks: chunks.length,
        action: 'DOCUMENT_INGESTION_EMBEDDINGS',
      },
    })
  } catch (embErr) {
    console.warn(
      `${logPrefix} ⚠️ Error generando embeddings en lote durante ingesta, se guardarán sin vector inicial:`,
      embErr
    )
  }

  // 2. Eliminar fragmentos previos del documento para re-indexación limpia
  console.log(
    `${logPrefix} 🧹 Limpiando fragmentos antiguos de doc ID "${documentId}" en base de datos...`
  )
  await prisma.documentChunk.deleteMany({
    where: { documentId }
  })

  // 3. Insertar los nuevos fragmentos en Prisma con metadatos y vector embedding persistido
  console.log(
    `${logPrefix} 💾 Guardando ${chunks.length} chunks con metadatos y embeddings en PostgreSQL...`
  )
  await prisma.documentChunk.createMany({
    data: chunks.map((c, idx) => ({
      documentId,
      chunkIndex: c.chunkIndex,
      content: c.content,
      pageNumber: c.pageNumber,
      metadata: {
        ...(c.metadata || {}),
        categoria: categoryCode,
        embedding: chunkEmbeddings[idx] || null,
      },
    }))
  })

  // 4. Actualizar estado del documento a INDEXED y su conteo de chunks
  console.log(
    `${logPrefix} 🏷️ Marcando documento ID "${documentId}" como INDEXED (chunkCount: ${chunks.length})...`
  )
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: 'INDEXED',
      chunkCount: chunks.length,
      updatedAt: new Date()
    }
  })

  console.log(
    `${logPrefix} 🏁 ✅ ¡Indexación RAG contextual y vectorial completada para "${docTitle}"!`
  )
  return { success: true, chunkCount: chunks.length }
}

import { prisma, ModelProvider, TokenUsageConcept, Prisma } from '@/lib/prisma'
import { recordTokenUsageLog } from '@/lib/ai/token-tracker'
import { DOCUMENT_TRANSCRIPTION_MODEL_CODE, DEFAULT_EMBEDDING_MODEL } from '@/constants'
import { generateEmbeddingsWithUsage } from '@/lib/ai/embeddings'
import { sanitizeMojibake, stripBase64Images } from '@/lib/utils'
import {
  extractTocTreeFromMarkdown,
  splitTextIntoStructuralChunks,
} from '@/lib/ai/toc-extractor'
import type { DocumentTocTree } from '@/types/stair'

export { extractTocTreeFromMarkdown, splitTextIntoStructuralChunks }
export type { DocumentTocTree }

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
  mimeType: string = 'application/pdf',
  optionalBuffer?: Buffer
): Promise<string> {
  const logPrefix = `[RAG_INDEXER] [${new Date().toISOString()}]`
  const cleanUrl = fileUrl.trim()
  if (!cleanUrl && (!optionalBuffer || optionalBuffer.byteLength === 0)) {
    console.error(`${logPrefix} ❌ URL de documento vacía o inválida y no se suministró buffer.`)
    throw new Error('La URL del documento no es válida.')
  }

  console.log(`${logPrefix} 🚀 [Paso 1/3] Preparando binario de archivo...`)
  console.log(`${logPrefix} 🔗 URL: ${cleanUrl || '(buffer en memoria)'}`)
  console.log(`${logPrefix} 📋 MimeType esperado: ${mimeType}`)

  let buffer: Buffer

  if (optionalBuffer && optionalBuffer.byteLength > 0) {
    buffer = optionalBuffer
    console.log(
      `${logPrefix} ⚡ Reutilizando binario en memoria (${buffer.byteLength} bytes / ${(buffer.byteLength / 1024).toFixed(1)} KB)`
    )
  } else {
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
    buffer = Buffer.from(arrayBuffer)
    const downloadDurationMs = Date.now() - downloadStart

    console.log(
      `${logPrefix} ✅ [Paso 1/3] Archivo descargado en ${downloadDurationMs}ms: ${buffer.byteLength} bytes (${(buffer.byteLength / 1024).toFixed(1)} KB)`
    )
  }

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

Reglas de Estructuración en Markdown (.md) para la Arquitectura Sipán-STAIR:
1. Estructura la jerarquía formal con encabezados Markdown estandarizados:
   - Usa nivel 1 (# TÍTULO ...) para Títulos mayores o Denominación del Reglamento.
   - Usa nivel 2 (## CAPÍTULO ...) para Capítulos normativos (ej: "## Capítulo II: De la Matrícula Regular y Extemporánea").
   - Usa nivel 3 (### ARTÍCULO ...) para cada Artículo normativo individual (ej: "### Artículo 17: Requisitos y Plazos").
2. No cortes ni trunques los artículos. Transcribe el texto íntegro de cada artículo incluyendo todos sus incisos, literales y párrafos.
3. Si el documento contiene un Índice general o Tabla de Contenidos (ToC) al inicio, transcríbelo fielmente con viñetas.
4. Si hay páginas identificadas en el PDF, incluye separadores con formato exacto "--- Página X ---".
5. Si hay tablas, escalas de tasas, calendarios de pagos o cronogramas, represéntalos en tablas Markdown con sintaxis GFM.
6. Mantén la terminología y formalidad institucional estricta de la USS.`

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
        body: new Uint8Array(buffer),
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
  const artMatch = text.match(/(?:^|\n)(?:#+\s*)?(?:(art[íi]culo|art\.?)\s*\d+[^\n.:]*)/i)

  return {
    capitulo: capMatch ? capMatch[0].replace(/^#+\s*/, '').trim() : undefined,
    articulo: artMatch ? artMatch[0].replace(/^#+\s*/, '').trim() : undefined,
  }
}

/**
 * Divide texto o markdown extenso en fragmentos semánticos enriquecidos (chunks) con solapamiento (overlap),
 * inyección de encabezados contextuales (Header Prepending) y extracción de metadatos estructurados.
 */
/**
 * Divide texto o markdown en fragmentos semánticos enriquecidos basados en la jerarquía
 * normativa institucional (STAIR), asegurando que los artículos no sean cortados arbitrariamente
 * e inyectando breadcrumbs contextuales completos.
 */
export function splitTextIntoChunks(
  text: string,
  _chunkSize: number = 3000,
  _overlap: number = 90,
  documentTitle: string = 'Documento Institucional USS',
  categoryCode: string = 'GENERAL'
): TextChunk[] {
  const structuralChunks = splitTextIntoStructuralChunks(
    text,
    documentTitle,
    categoryCode,
    _chunkSize
  )

  return structuralChunks.map((c) => ({
    content: c.content,
    pageNumber: c.pageNumber,
    chunkIndex: c.chunkIndex,
    metadata: c.metadata as unknown as Record<string, unknown>,
  }))
}

/**
 * Indexa el contenido textual completo de un documento en la base de datos (Prisma),
 * extrayendo el Árbol ToC jerárquico (STAIR), segmentando por artículos completos con breadcrumbs,
 * persistiendo vector embeddings pre-calculados y actualizando el estado a INDEXED.
 */
export async function indexDocumentContent(
  documentId: string,
  rawContent: string
): Promise<{ success: boolean; chunkCount: number; tocNodesCount: number }> {
  const logPrefix = `[RAG_INDEXER_STAIR] [${new Date().toISOString()}]`
  console.log(
    `${logPrefix} ✂️ [Paso 3/3] Iniciando segmentación estructural y extracción de ToC (Sipán-STAIR)...`
  )

  // Consultar metadatos del documento desde la BD
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { category: true },
  })

  const docTitle = doc?.title || 'Reglamento Institucional USS'
  const categoryCode = doc?.category?.code || 'GENERAL'

  // Limpiar cualquier imagen base64 y normalizar codificación antes de procesar
  const cleanedContent = stripBase64Images(sanitizeMojibake(rawContent))

  // 1. Extraer el Árbol ToC Canónico (STAIR: Títulos > Capítulos > Artículos)
  console.log(`${logPrefix} 🌳 Extrayendo árbol ToC jerárquico para "${docTitle}"...`)
  const tocTree = extractTocTreeFromMarkdown(cleanedContent, docTitle)
  const tocNodesCount = tocTree.reduce((acc, node) => {
    let count = 1
    if ('chapters' in node && node.chapters) {
      count += node.chapters.length
      for (const ch of node.chapters) {
        if (ch.articles) count += ch.articles.length
      }
    } else if ('articles' in node && node.articles) {
      count += node.articles.length
    }
    return acc + count
  }, 0)

  console.log(
    `${logPrefix} ✅ Árbol ToC generado: ${tocTree.length} ramas principales, ~${tocNodesCount} nodos identificados.`
  )

  // 2. Segmentación estructural por Artículos / Nodos Hoja con Breadcrumbs Inyectados
  const structuralChunks = splitTextIntoStructuralChunks(
    cleanedContent,
    docTitle,
    categoryCode
  )
  console.log(
    `${logPrefix} 🧩 Chunks estructurales generados: ${structuralChunks.length} fragmentos basados en artículos/secciones con Breadcrumbs.`
  )

  if (structuralChunks.length === 0) {
    console.error(
      `${logPrefix} ❌ El contenido resultante no produjo ningún chunk legible.`
    )
    throw new Error(
      'El contenido del documento está vacío o no contiene texto legible.'
    )
  }

  // 3. Pre-calcular vector embeddings para todos los chunks de una sola vez
  console.log(
    `${logPrefix} 📐 Calculando embeddings vectoriales persistentes (${structuralChunks.length} fragmentos)...`
  )
  let chunkEmbeddings: number[][] = []
  try {
    const chunkTexts = structuralChunks.map((c) => c.content)
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
        totalChunks: structuralChunks.length,
        action: 'DOCUMENT_INGESTION_EMBEDDINGS_STAIR',
      },
    })
  } catch (embErr) {
    console.warn(
      `${logPrefix} ⚠️ Error generando embeddings en lote durante ingesta, se guardarán sin vector inicial:`,
      embErr
    )
  }

  // 4. Eliminar fragmentos previos del documento para re-indexación limpia
  console.log(
    `${logPrefix} 🧹 Limpiando fragmentos antiguos de doc ID "${documentId}" en base de datos...`
  )
  await prisma.documentChunk.deleteMany({
    where: { documentId }
  })

  // 5. Insertar los nuevos fragmentos en Prisma con metadatos y vector embedding persistido
  console.log(
    `${logPrefix} 💾 Guardando ${structuralChunks.length} chunks con metadatos jerárquicos y embeddings en PostgreSQL...`
  )
  await prisma.documentChunk.createMany({
    data: structuralChunks.map((c, idx) => ({
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

  // 6. Actualizar estado del documento a INDEXED, conteo de chunks y persistir el tocTree (STAIR)
  console.log(
    `${logPrefix} 🏷️ Guardando tocTree y marcando documento ID "${documentId}" como INDEXED (chunkCount: ${structuralChunks.length})...`
  )
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: 'INDEXED',
      chunkCount: structuralChunks.length,
      tocTree: tocTree.length > 0 ? (tocTree as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      updatedAt: new Date()
    }
  })

  console.log(
    `${logPrefix} 🏁 ✅ ¡Indexación Sipán-STAIR completada exitosamente para "${docTitle}"!`
  )
  return {
    success: true,
    chunkCount: structuralChunks.length,
    tocNodesCount,
  }
}

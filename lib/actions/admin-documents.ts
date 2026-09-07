'use server'

import { prisma, Role, type DocumentStatus } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { CACHE_PATHS } from '@/constants'
import {
  indexDocumentContent,
  extractAndStructureToMarkdown,
} from '@/lib/ai/document-processor'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { sanitizeMojibake, stripBase64Images } from '@/lib/utils'

export async function getAdminDocuments() {
  await requireRole(Role.ADMIN)

  const [documents, topicCategories] = await Promise.all([
    prisma.document.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        uploadedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            chunks: true,
            citations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.topicCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        subcategories: true,
        _count: {
          select: { documents: true, messages: true },
        },
      },
    }),
  ])

  const totalBytes = documents.reduce((acc, doc) => acc + (doc.sizeBytes || 0), 0)
  const indexedCount = documents.filter((d) => d.status === 'INDEXED').length

  return {
    documents,
    topicCategories,
    stats: {
      total: documents.length,
      indexed: indexedCount,
      totalBytes,
    },
  }
}

export async function createDocumentDirectAction(data: {
  title: string
  fileName?: string
  publicUrl?: string
  categoryId?: string | null
  content: string
}) {
  const user = await requireRole(Role.ADMIN)

  if (!data.title.trim()) {
    throw new Error('El título del documento es requerido.')
  }
  if (!data.content.trim()) {
    throw new Error('Debe proporcionar el contenido del documento o reglamento.')
  }

  const cleanContent = stripBase64Images(sanitizeMojibake(data.content.trim()))

  const doc = await prisma.document.create({
    data: {
      title: data.title.trim(),
      fileName: data.fileName || `${data.title.trim().toLowerCase().replace(/\s+/g, '-')}.txt`,
      publicUrl: data.publicUrl?.trim() || null,
      fileUrl: data.publicUrl?.trim() || null,
      mimeType: 'text/plain',
      sizeBytes: Buffer.byteLength(cleanContent, 'utf8'),
      categoryId: data.categoryId || null,
      uploadedById: user.id,
      status: 'PROCESSING',
    },
  })

  // Indexar chunks inmediatamente
  const result = await indexDocumentContent(doc.id, cleanContent)

  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true, document: doc, chunkCount: result.chunkCount }
}

export async function getDocumentChunksAction(documentId: string) {
  await requireRole(Role.ADMIN)

  const chunks = await prisma.documentChunk.findMany({
    where: { documentId },
    orderBy: { chunkIndex: 'asc' },
    include: {
      _count: {
        select: { citations: true },
      },
    },
  })

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, title: true, publicUrl: true, status: true },
  })

  return { document: doc, chunks }
}

export async function updateDocumentChunkAction(
  chunkId: string,
  content: string,
  pageNumber?: number | null
) {
  await requireRole(Role.ADMIN)

  if (!content.trim()) {
    throw new Error('El contenido del fragmento no puede estar vacío.')
  }

  let embedding: number[] | null = null
  try {
    embedding = await generateEmbedding(content.trim())
  } catch {}

  const existingChunk = await prisma.documentChunk.findUnique({
    where: { id: chunkId },
    select: { metadata: true },
  })
  const prevMeta = (existingChunk?.metadata as Record<string, unknown>) || {}

  const updated = await prisma.documentChunk.update({
    where: { id: chunkId },
    data: {
      content: content.trim(),
      pageNumber: pageNumber !== undefined ? pageNumber : undefined,
      metadata: {
        ...prevMeta,
        embedding: embedding || prevMeta.embedding || null,
        estado: 'ACTIVO',
        updatedAt: new Date().toISOString(),
      },
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true, chunk: updated }
}

export async function addDocumentChunkAction(
  documentId: string,
  content: string,
  pageNumber?: number | null
) {
  await requireRole(Role.ADMIN)

  if (!content.trim()) {
    throw new Error('El contenido del fragmento no puede estar vacío.')
  }

  const [doc, lastChunk, sampleChunk] = await Promise.all([
    prisma.document.findUnique({
      where: { id: documentId },
      include: { category: true },
    }),
    prisma.documentChunk.findFirst({
      where: { documentId },
      orderBy: { chunkIndex: 'desc' },
      select: { chunkIndex: true },
    }),
    prisma.documentChunk.findFirst({
      where: { documentId },
      select: { metadata: true },
    }),
  ])

  const newIndex = (lastChunk?.chunkIndex ?? -1) + 1
  const sampleMeta = (sampleChunk?.metadata as Record<string, unknown>) || {}

  let embedding: number[] | null = null
  try {
    embedding = await generateEmbedding(content.trim())
  } catch {}

  const newChunk = await prisma.documentChunk.create({
    data: {
      documentId,
      chunkIndex: newIndex,
      content: content.trim(),
      pageNumber: pageNumber || null,
      metadata: {
        documentTitle: doc?.title || 'Documento Institucional USS',
        categoria: doc?.category?.code || sampleMeta.categoria || 'GENERAL',
        anio_vigencia: sampleMeta.anio_vigencia || 2026,
        embedding,
        estado: 'ACTIVO',
        createdAt: new Date().toISOString(),
      },
    },
  })

  // Incrementar chunkCount en Document
  await prisma.document.update({
    where: { id: documentId },
    data: {
      chunkCount: { increment: 1 },
      status: 'INDEXED',
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true, chunk: newChunk }
}

export async function deleteDocumentChunkAction(chunkId: string) {
  await requireRole(Role.ADMIN)

  const chunk = await prisma.documentChunk.delete({
    where: { id: chunkId },
  })

  if (chunk) {
    await prisma.document.update({
      where: { id: chunk.documentId },
      data: {
        chunkCount: { decrement: 1 },
      },
    })
  }

  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true }
}

export async function reindexDocumentAction(documentId: string, content: string) {
  await requireRole(Role.ADMIN)

  if (!content.trim()) {
    throw new Error('No hay contenido para indexar.')
  }

  const result = await indexDocumentContent(documentId, content)
  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return result
}

export async function updateDocumentDetailsAction(
  documentId: string,
  data: {
    title: string
    publicUrl?: string | null
    categoryId?: string | null
  }
) {
  await requireRole(Role.ADMIN)

  if (!data.title.trim()) {
    throw new Error('El título del documento es requerido.')
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: data.title.trim(),
      publicUrl: data.publicUrl?.trim() || null,
      fileUrl: data.publicUrl?.trim() || null,
      categoryId: data.categoryId || null,
    },
    include: {
      category: true,
    },
  })

  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true, document: updated }
}

export async function toggleDocumentStatus(documentId: string, status: DocumentStatus) {
  await requireRole(Role.ADMIN)

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { status },
  })

  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true, document: updated }
}

export async function updateDocumentCategory(documentId: string, categoryId: string | null) {
  await requireRole(Role.ADMIN)

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { categoryId: categoryId || null },
  })

  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true, document: updated }
}

export async function deleteDocumentAction(documentId: string) {
  await requireRole(Role.ADMIN)

  await prisma.document.delete({
    where: { id: documentId },
  })

  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true }
}

export async function markDocumentAsIndexed(documentId: string) {
  await requireRole(Role.ADMIN)

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { status: 'INDEXED' },
  })

  revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
  return { success: true, document: updated }
}

/**
 * Procesa un documento subido (PDF/TXT), lo transcribe a Markdown con Gemini OCR,
 * lo fragmenta en chunks semánticos y lo indexa automáticamente.
 */
export async function processAndIndexDocumentAction(documentId: string) {
  const logPrefix = `[ACTION_PROCESS_INDEX] [${new Date().toISOString()}]`
  console.log(`${logPrefix} 📥 Invocando Server Action para Document ID: "${documentId}"`)

  await requireRole(Role.ADMIN)

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  })

  if (!doc) {
    console.error(`${logPrefix} ❌ Documento con ID "${documentId}" no encontrado en base de datos.`)
    throw new Error('Documento no encontrado.')
  }

  const fileUrl = doc.fileUrl || doc.publicUrl
  if (!fileUrl) {
    console.error(`${logPrefix} ❌ El documento no dispone de una URL válida (fileUrl/publicUrl vacíos).`)
    throw new Error('El documento no dispone de una URL válida para procesar.')
  }

  console.log(`${logPrefix} 📄 Documento: "${doc.title || doc.fileName}", Tamaño: ${doc.sizeBytes} bytes, Mime: ${doc.mimeType}`)

  // 1. Marcar temporalmente como PROCESSING
  await prisma.document.update({
    where: { id: documentId },
    data: { status: 'PROCESSING' },
  })

  try {
    // 2. Extraer y transcribir a Markdown enriquecido mediante Gemini Multimodal
    console.log(`${logPrefix} ⏳ Llamando a extractAndStructureToMarkdown...`)
    const markdownContent = await extractAndStructureToMarkdown(
      fileUrl,
      doc.mimeType || 'application/pdf'
    )

    // 3. Segmentar semánticamente en chunks con solapamiento e indexar en Neon
    console.log(`${logPrefix} ⏳ Llamando a indexDocumentContent con ${markdownContent.length} caracteres...`)
    const result = await indexDocumentContent(documentId, markdownContent)

    revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
    revalidatePath(CACHE_PATHS.ADMIN_DASHBOARD)

    console.log(`${logPrefix} 🎉 Server Action completado con éxito: ${result.chunkCount} chunks creados.`)
    return {
      success: true,
      chunkCount: result.chunkCount,
      markdownPreview: markdownContent.substring(0, 500),
    }
  } catch (err: unknown) {
    console.error(`${logPrefix} 💥 Error fatal en Server Action:`, err)
    // Marcar como ERROR si falla
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'ERROR' },
    })
    const msg = err instanceof Error ? err.message : 'Error durante el procesamiento e indexación del documento.'
    throw new Error(msg)
  }
}

/**
 * Obtiene el contenido estructurado en Markdown y metadatos del documento para visualización avanzada
 */
export async function getDocumentPreviewDataAction(documentId: string) {
  const logPrefix = `[ACTION_PREVIEW_DOC] [${new Date().toISOString()}]`
  console.log(`${logPrefix} 🔍 Solicitando vista previa de documento: "${documentId}"`)

  await requireRole(Role.ADMIN)

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      uploadedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      chunks: {
        orderBy: { chunkIndex: 'asc' },
        select: {
          id: true,
          chunkIndex: true,
          content: true,
          pageNumber: true,
          metadata: true,
        },
      },
    },
  })

  if (!doc) {
    console.error(`${logPrefix} ❌ Documento "${documentId}" no encontrado.`)
    throw new Error('Documento no encontrado en el sistema.')
  }

  const isPdf =
    Boolean(doc.mimeType?.toLowerCase().includes('pdf')) ||
    doc.fileName.toLowerCase().endsWith('.pdf')

  let markdownContent = ''
  let sourceOrigin: 'file_download' | 'reconstructed_chunks' = 'reconstructed_chunks'

  // 1. Si no es PDF y posee URL pública o de archivo, intentar descargar el contenido original
  const directUrl = doc.fileUrl || doc.publicUrl
  if (!isPdf && directUrl) {
    try {
      console.log(`${logPrefix} 🌐 Descargando contenido directo desde URL: ${directUrl}`)
      const res = await fetch(directUrl, {
        signal: AbortSignal.timeout(12_000),
      })
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer()
        const buf = Buffer.from(arrayBuf)
        markdownContent = buf.toString('utf-8')
        sourceOrigin = 'file_download'
        console.log(
          `${logPrefix} ✅ Descarga exitosa (${buf.byteLength} bytes) decodificado como UTF-8.`
        )
      }
    } catch (fetchErr) {
      console.warn(
        `${logPrefix} ⚠️ No se pudo descargar directamente desde URL, recurriendo a fragmentos RAG:`,
        fetchErr
      )
    }
  }

  // 2. Si es PDF o si la descarga directa falló, reconstruir el documento desde los fragmentos de la BD
  if (!markdownContent && doc.chunks.length > 0) {
    console.log(
      `${logPrefix} 🧩 Reconstruyendo contenido Markdown a partir de ${doc.chunks.length} fragmentos RAG...`
    )
    markdownContent = doc.chunks.map((c) => c.content).join('\n\n')
    sourceOrigin = 'reconstructed_chunks'
  }

  // 3. Sanitizar Mojibake y eliminar imágenes base64 extensas que generen ruido
  markdownContent = stripBase64Images(sanitizeMojibake(markdownContent))

  // 4. Formatear y sanitizar chunks para visualización contextual
  const formattedChunks = doc.chunks.map((c) => {
    const meta = c.metadata as Record<string, unknown> | null
    const hasEmbedding = Boolean(
      meta && Array.isArray(meta.embedding) && meta.embedding.length > 0
    )
    return {
      id: c.id,
      chunkIndex: c.chunkIndex,
      content: stripBase64Images(sanitizeMojibake(c.content)),
      pageNumber: c.pageNumber,
      hasEmbedding,
    }
  })

  // Estadísticas básicas
  const wordCount = markdownContent
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const charCount = markdownContent.length
  const estimatedReadTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

  return {
    success: true,
    document: {
      id: doc.id,
      title: doc.title || doc.fileName,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      publicUrl: doc.publicUrl,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      status: doc.status,
      chunkCount: doc.chunkCount,
      category: doc.category,
      uploadedBy: doc.uploadedBy,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    },
    isPdf,
    markdownContent,
    sourceOrigin,
    stats: {
      wordCount,
      charCount,
      estimatedReadTimeMinutes,
    },
    chunks: formattedChunks,
  }
}

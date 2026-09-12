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
      breadcrumb: (meta?.breadcrumb as string) || null,
      articulo: (meta?.articulo as string) || null,
      capitulo: (meta?.capitulo as string) || null,
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
      tocTree: doc.tocTree,
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

/**
 * Ingesta un documento institucional descargándolo directamente desde una URL pública
 * (ej. portal de transparencia USS o Sunedu), registrándolo en la base de conocimiento,
 * preservando la URL original como publicUrl institucional y ejecutando el pipeline Sipán-STAIR.
 */
export async function ingestDocumentFromUrlAction(data: {
  url: string
  title?: string
  categoryId?: string | null
}) {
  const logPrefix = `[ACTION_INGEST_URL] [${new Date().toISOString()}]`
  console.log(`${logPrefix} 🚀 Iniciando ingesta desde URL: "${data.url}"`)

  const user = await requireRole(Role.ADMIN)

  const rawUrl = data.url?.trim()
  if (!rawUrl) {
    throw new Error('La URL del documento es requerida.')
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('El protocolo debe ser http: o https:')
    }
  } catch {
    throw new Error('La URL ingresada no es válida. Debe incluir http:// o https://')
  }

  // 1. Descargar el binario del documento (timeout 45s)
  console.log(`${logPrefix} 📥 Descargando archivo desde: ${rawUrl}`)
  let downloadRes: Response
  try {
    downloadRes = await fetch(rawUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SipánGPT/1.0',
        Accept: 'application/pdf,text/plain,text/markdown,*/*',
      },
      signal: AbortSignal.timeout(45_000),
    })
  } catch (netErr: unknown) {
    const isTimeout = netErr instanceof DOMException && netErr.name === 'TimeoutError'
    console.error(`${logPrefix} ❌ Error de red descargando desde URL:`, netErr)
    throw new Error(
      isTimeout
        ? 'Tiempo de espera agotado al descargar el archivo desde el enlace (>45s).'
        : `Error de conexión al descargar desde el enlace: ${netErr instanceof Error ? netErr.message : String(netErr)}`
    )
  }

  if (!downloadRes.ok) {
    console.error(
      `${logPrefix} ❌ HTTP no exitoso: ${downloadRes.status} ${downloadRes.statusText}`
    )
    throw new Error(
      `No se pudo descargar el documento (HTTP ${downloadRes.status} ${downloadRes.statusText}). Verifica que el enlace sea público y accesible.`
    )
  }

  const contentType = downloadRes.headers.get('content-type')?.toLowerCase() || ''
  const contentDisposition = downloadRes.headers.get('content-disposition') || ''

  // 2. Extraer nombre de archivo
  let fileName = ''
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i)
    if (match?.[1]) {
      fileName = decodeURIComponent(match[1].trim())
    }
  }

  if (!fileName) {
    const pathname = parsedUrl.pathname
    const lastSegment = pathname.split('/').filter(Boolean).pop()
    if (lastSegment && lastSegment.includes('.')) {
      fileName = decodeURIComponent(lastSegment)
    }
  }

  // 3. Determinar MIME Type
  let mimeType = 'application/pdf'
  if (contentType.includes('text/plain') || fileName.toLowerCase().endsWith('.txt')) {
    mimeType = 'text/plain'
  } else if (
    contentType.includes('text/markdown') ||
    fileName.toLowerCase().endsWith('.md') ||
    fileName.toLowerCase().endsWith('.markdown')
  ) {
    mimeType = 'text/markdown'
  } else if (contentType.includes('application/pdf') || fileName.toLowerCase().endsWith('.pdf')) {
    mimeType = 'application/pdf'
  } else if (contentType.startsWith('text/')) {
    mimeType = 'text/plain'
  }

  if (!fileName) {
    const ext = mimeType === 'text/markdown' ? 'md' : mimeType === 'text/plain' ? 'txt' : 'pdf'
    fileName = `documento-institucional-${Date.now()}.${ext}`
  }

  const arrayBuffer = await downloadRes.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const sizeBytes = buffer.byteLength

  console.log(
    `${logPrefix} 📦 Binario descargado: ${fileName}, ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(1)} KB), Mime: ${mimeType}`
  )

  if (sizeBytes === 0) {
    throw new Error('El archivo descargado está vacío (0 bytes).')
  }
  if (sizeBytes > 32 * 1024 * 1024) {
    throw new Error('El archivo excede el tamaño máximo permitido de 32 MB.')
  }

  // Deducción de título limpio
  const derivedTitle = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const finalTitle = data.title?.trim() || derivedTitle || 'Documento Institucional USS'

  // 4. Intentar guardar una copia persistente en UploadThing mediante UTApi
  let storageFileUrl = rawUrl
  try {
    const { UTApi } = await import('uploadthing/server')
    const utapi = new UTApi()
    const fileObj = new File([buffer], fileName, { type: mimeType })
    const uploadRes = await utapi.uploadFiles([fileObj])
    if (uploadRes?.[0]?.data?.ufsUrl) {
      storageFileUrl = uploadRes[0].data.ufsUrl
      console.log(`${logPrefix} ☁️ Copia persistente subida a UploadThing: ${storageFileUrl}`)
    }
  } catch (utErr) {
    console.warn(`${logPrefix} ⚠️ No se pudo respaldar en UploadThing, usando URL origen:`, utErr)
  }

  // 5. Registrar el documento en Prisma
  const doc = await prisma.document.create({
    data: {
      title: finalTitle,
      fileName,
      fileUrl: storageFileUrl,
      publicUrl: rawUrl, // Enlace público institucional para citas y navegación de estudiantes
      mimeType,
      sizeBytes,
      categoryId: data.categoryId && data.categoryId !== 'none' ? data.categoryId : null,
      uploadedById: user.id,
      status: 'PROCESSING',
    },
  })

  console.log(`${logPrefix} 📄 Documento registrado en BD con ID: ${doc.id}`)

  // 6. Transcribir e indexar automáticamente con la arquitectura Sipán-STAIR
  try {
    const markdownContent = await extractAndStructureToMarkdown(
      storageFileUrl,
      mimeType,
      buffer
    )
    const result = await indexDocumentContent(doc.id, markdownContent)

    revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
    revalidatePath(CACHE_PATHS.ADMIN_DASHBOARD)

    console.log(
      `${logPrefix} ✅ Documento indexado exitosamente (${result.chunkCount} chunks, ToC Tree registrado).`
    )

    return {
      success: true,
      documentId: doc.id,
      title: doc.title,
      chunkCount: result.chunkCount,
      publicUrl: rawUrl,
    }
  } catch (indexErr) {
    console.error(`${logPrefix} ❌ Error en pipeline de indexación para doc ID ${doc.id}:`, indexErr)
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: 'ERROR' },
    })
    revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
    throw new Error(
      `El documento se guardó pero falló la indexación: ${indexErr instanceof Error ? indexErr.message : String(indexErr)}`
    )
  }
}


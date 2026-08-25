'use server'

import { prisma, Role, type DocumentStatus } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { indexDocumentContent } from '@/lib/ai/document-processor'

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

  const doc = await prisma.document.create({
    data: {
      title: data.title.trim(),
      fileName: data.fileName || `${data.title.trim().toLowerCase().replace(/\s+/g, '-')}.txt`,
      publicUrl: data.publicUrl?.trim() || null,
      fileUrl: data.publicUrl?.trim() || null,
      mimeType: 'text/plain',
      sizeBytes: Buffer.byteLength(data.content, 'utf8'),
      categoryId: data.categoryId || null,
      uploadedById: user.id,
      status: 'PROCESSING',
    },
  })

  // Indexar chunks inmediatamente
  const result = await indexDocumentContent(doc.id, data.content)

  revalidatePath('/admin/documents')
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

  const updated = await prisma.documentChunk.update({
    where: { id: chunkId },
    data: {
      content: content.trim(),
      pageNumber: pageNumber !== undefined ? pageNumber : undefined,
    },
  })

  revalidatePath('/admin/documents')
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

  const lastChunk = await prisma.documentChunk.findFirst({
    where: { documentId },
    orderBy: { chunkIndex: 'desc' },
    select: { chunkIndex: true },
  })

  const newIndex = (lastChunk?.chunkIndex ?? -1) + 1

  const newChunk = await prisma.documentChunk.create({
    data: {
      documentId,
      chunkIndex: newIndex,
      content: content.trim(),
      pageNumber: pageNumber || null,
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

  revalidatePath('/admin/documents')
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

  revalidatePath('/admin/documents')
  return { success: true }
}

export async function reindexDocumentAction(documentId: string, content: string) {
  await requireRole(Role.ADMIN)

  if (!content.trim()) {
    throw new Error('No hay contenido para indexar.')
  }

  const result = await indexDocumentContent(documentId, content)
  revalidatePath('/admin/documents')
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

  revalidatePath('/admin/documents')
  return { success: true, document: updated }
}

export async function toggleDocumentStatus(documentId: string, status: DocumentStatus) {
  await requireRole(Role.ADMIN)

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { status },
  })

  revalidatePath('/admin/documents')
  return { success: true, document: updated }
}

export async function updateDocumentCategory(documentId: string, categoryId: string | null) {
  await requireRole(Role.ADMIN)

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { categoryId: categoryId || null },
  })

  revalidatePath('/admin/documents')
  return { success: true, document: updated }
}

export async function deleteDocumentAction(documentId: string) {
  await requireRole(Role.ADMIN)

  await prisma.document.delete({
    where: { id: documentId },
  })

  revalidatePath('/admin/documents')
  return { success: true }
}

export async function markDocumentAsIndexed(documentId: string) {
  await requireRole(Role.ADMIN)

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { status: 'INDEXED' },
  })

  revalidatePath('/admin/documents')
  return { success: true, document: updated }
}


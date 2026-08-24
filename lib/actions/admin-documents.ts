'use server'

import { prisma, Role, type DocumentStatus } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

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

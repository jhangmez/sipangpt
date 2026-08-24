'use server'

import { prisma, Role, type DocumentStatus } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getAdminDocuments() {
  await requireRole(Role.ADMIN)

  const documents = await prisma.document.findMany({
    include: {
      uploadedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalBytes = documents.reduce((acc, doc) => acc + (doc.sizeBytes || 0), 0)
  const indexedCount = documents.filter((d) => d.status === 'INDEXED').length

  return {
    documents,
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

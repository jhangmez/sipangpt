import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma, Prisma, type DocumentStatus } from '@/lib/prisma'
import { getAdminApiAuth } from '@/lib/session'
import { invalidateRagCache } from '@/lib/ai/rag'
import {
  CACHE_PATHS,
  RAG_SNAPSHOT_MAX_CHUNKS_PER_BATCH,
  RAG_SNAPSHOT_VALID_STATUSES,
} from '@/constants'
import {
  hydrateChunkMetadataForDb,
  type RagSnapshotCategory,
  type RagSnapshotChunk,
  type RagSnapshotDocument,
  type RagSnapshotImportMode,
} from '@/lib/ai/rag-snapshot'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const VALID_STATUS_SET = new Set<string>(RAG_SNAPSHOT_VALID_STATUSES)

function parseSafeDate(isoOrDate?: string): Date {
  if (!isoOrDate) return new Date()
  const parsed = new Date(isoOrDate)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

/**
 * Sincroniza TopicCategory por código o nombre sin eliminar categorías existentes
 * para preservar relaciones históricas en mensajes o preguntas frecuentes.
 */
async function syncCategories(
  categories: RagSnapshotCategory[]
): Promise<Map<string, string>> {
  const existingCategories = await prisma.topicCategory.findMany({
    select: { id: true, code: true, name: true },
  })

  const idByCode = new Map<string, string>()
  const idByLowerName = new Map<string, string>()

  for (const cat of existingCategories) {
    idByCode.set(cat.code, cat.id)
    idByLowerName.set(cat.name.trim().toLowerCase(), cat.id)
  }

  for (const cat of categories) {
    const code = cat.code?.trim()
    const name = cat.name?.trim()
    if (!code || !name) continue

    const existingId = idByCode.get(code) ?? idByLowerName.get(name.toLowerCase())
    if (existingId) {
      idByCode.set(code, existingId)
      continue
    }

    const created = await prisma.topicCategory.create({
      data: {
        code,
        name,
        description: cat.description ?? null,
        order: typeof cat.order === 'number' && Number.isFinite(cat.order) ? cat.order : 0,
      },
      select: { id: true, code: true, name: true },
    })
    idByCode.set(created.code, created.id)
    idByLowerName.set(created.name.trim().toLowerCase(), created.id)
  }

  return idByCode
}

/**
 * Importa snapshots RAG en 3 fases tolerantes a límites de carga de proxy:
 * 1) `prepare`: sincroniza categorías, limpia documentos según modo y crea encabezados.
 * 2) `import-chunks`: inserta lotes de fragmentos reconstruyendo embeddings vectoriales.
 * 3) `finalize`: actualiza conteo real de chunks, restaura estados finales e invalida caché RAG.
 */
export async function POST(request: NextRequest) {
  const authCheck = await getAdminApiAuth()
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo JSON inválido en la solicitud de importación.' },
      { status: 400 }
    )
  }

  const action = body?.action

  try {
    if (action === 'prepare') {
      const mode: RagSnapshotImportMode = body.mode === 'merge' ? 'merge' : 'replace'
      const categories = Array.isArray(body.categories)
        ? (body.categories as RagSnapshotCategory[])
        : []
      const documents = Array.isArray(body.documents)
        ? (body.documents as RagSnapshotDocument[])
        : []

      if (documents.length === 0) {
        return NextResponse.json(
          { error: 'Se requiere al menos un documento en el arreglo "documents".' },
          { status: 400 }
        )
      }

      for (const doc of documents) {
        if (!doc?.id || !doc?.title || !doc?.fileName || !doc?.mimeType) {
          return NextResponse.json(
            { error: 'Uno o más documentos tienen campos obligatorios incompletos.' },
            { status: 400 }
          )
        }
      }

      const categoryIdByCode = await syncCategories(categories)

      if (mode === 'replace') {
        // Cascada limpia DocumentChunk y preserva MessageCitation vía onDelete: SetNull
        await prisma.document.deleteMany({})
        invalidateRagCache()
      } else {
        const incomingIds = documents.map((d) => d.id)
        await prisma.documentChunk.deleteMany({
          where: { documentId: { in: incomingIds } },
        })
      }

      for (const doc of documents) {
        const categoryId = doc.categoryCode
          ? (categoryIdByCode.get(doc.categoryCode) ?? null)
          : null
        const tocValue: Prisma.InputJsonValue | typeof Prisma.JsonNull =
          doc.tocTree === null || doc.tocTree === undefined
            ? Prisma.JsonNull
            : (doc.tocTree as Prisma.InputJsonValue)

        const baseData = {
          title: doc.title.trim(),
          fileName: doc.fileName.trim(),
          fileUrl: doc.fileUrl ?? null,
          publicUrl: doc.publicUrl ?? null,
          mimeType: doc.mimeType.trim(),
          sizeBytes: Math.max(0, Math.round(doc.sizeBytes || 0)),
          status: 'PROCESSING' as DocumentStatus,
          chunkCount: 0,
          categoryId,
          uploadedById: authCheck.userId,
          tocTree: tocValue,
        }

        if (mode === 'replace') {
          await prisma.document.create({
            data: {
              id: doc.id,
              ...baseData,
              createdAt: parseSafeDate(doc.createdAt),
            },
          })
        } else {
          await prisma.document.upsert({
            where: { id: doc.id },
            create: {
              id: doc.id,
              ...baseData,
              createdAt: parseSafeDate(doc.createdAt),
            },
            update: baseData,
          })
        }
      }

      return NextResponse.json({
        ok: true,
        mode,
        documentsPrepared: documents.length,
        categoriesSynced: categoryIdByCode.size,
      })
    }

    if (action === 'import-chunks') {
      const chunks = Array.isArray(body.chunks)
        ? (body.chunks as RagSnapshotChunk[])
        : null

      if (!chunks || chunks.length === 0) {
        return NextResponse.json(
          { error: 'Se requiere un lote no vacío en "chunks".' },
          { status: 400 }
        )
      }

      if (chunks.length > RAG_SNAPSHOT_MAX_CHUNKS_PER_BATCH) {
        return NextResponse.json(
          {
            error: `El lote excede el máximo permitido (${RAG_SNAPSHOT_MAX_CHUNKS_PER_BATCH} fragmentos por solicitud).`,
          },
          { status: 400 }
        )
      }

      const uniqueDocIds = Array.from(new Set(chunks.map((c) => c.documentId)))
      const existingDocs = await prisma.document.findMany({
        where: { id: { in: uniqueDocIds } },
        select: { id: true },
      })
      const existingDocIdSet = new Set(existingDocs.map((d) => d.id))

      for (const ch of chunks) {
        if (!ch?.id || !ch?.documentId || typeof ch.content !== 'string') {
          return NextResponse.json(
            { error: 'Uno o más fragmentos del lote tienen estructura inválida.' },
            { status: 400 }
          )
        }
        if (!existingDocIdSet.has(ch.documentId)) {
          return NextResponse.json(
            {
              error: `El documento padre "${ch.documentId}" no fue preparado antes de insertar fragmentos.`,
            },
            { status: 400 }
          )
        }
      }

      const rows: Prisma.DocumentChunkCreateManyInput[] = chunks.map((ch) => {
        const hydrated = hydrateChunkMetadataForDb(ch.metadata)
        return {
          id: ch.id,
          documentId: ch.documentId,
          chunkIndex: Math.trunc(ch.chunkIndex),
          content: ch.content,
          pageNumber:
            typeof ch.pageNumber === 'number' && Number.isFinite(ch.pageNumber)
              ? Math.trunc(ch.pageNumber)
              : null,
          metadata:
            hydrated === null
              ? Prisma.JsonNull
              : (hydrated as Prisma.InputJsonValue),
          createdAt: parseSafeDate(ch.createdAt),
        }
      })

      const result = await prisma.documentChunk.createMany({
        data: rows,
        skipDuplicates: true,
      })

      return NextResponse.json({
        ok: true,
        inserted: result.count,
      })
    }

    if (action === 'finalize') {
      const documents = Array.isArray(body.documents)
        ? (body.documents as Array<{ id: string; status: string }>)
        : null

      if (!documents || documents.length === 0) {
        return NextResponse.json(
          { error: 'Se requiere la lista de documentos en "finalize".' },
          { status: 400 }
        )
      }

      let totalChunks = 0
      let indexedDocuments = 0

      for (const item of documents) {
        if (!item?.id || !VALID_STATUS_SET.has(item.status)) {
          return NextResponse.json(
            { error: `Estado final inválido para documento "${String(item?.id)}".` },
            { status: 400 }
          )
        }

        const actualCount = await prisma.documentChunk.count({
          where: { documentId: item.id },
        })
        const nextStatus = item.status as DocumentStatus

        await prisma.document.update({
          where: { id: item.id },
          data: {
            status: nextStatus,
            chunkCount: actualCount,
            updatedAt: new Date(),
          },
        })

        totalChunks += actualCount
        if (nextStatus === 'INDEXED') {
          indexedDocuments++
        }
      }

      invalidateRagCache()

      revalidatePath(CACHE_PATHS.ADMIN_DOCUMENTS)
      revalidatePath(CACHE_PATHS.ADMIN_CATEGORIES)
      revalidatePath(CACHE_PATHS.CHAT)
      revalidatePath(CACHE_PATHS.HOME)

      return NextResponse.json({
        ok: true,
        documentsFinalized: documents.length,
        totalChunks,
        indexedDocuments,
      })
    }

    return NextResponse.json(
      { error: `Acción de importación desconocida: "${String(action)}".` },
      { status: 400 }
    )
  } catch (err: unknown) {
    console.error('[API_ADMIN_DOCS_IMPORT_ERROR]', err)
    const message =
      err instanceof Error ? err.message : 'Error interno durante la importación RAG.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

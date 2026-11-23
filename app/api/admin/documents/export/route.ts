import { NextRequest, NextResponse } from 'next/server'
import { gzipSync } from 'node:zlib'
import { prisma } from '@/lib/prisma'
import { getAdminApiAuth } from '@/lib/session'
import { RAG_SNAPSHOT_FORMAT, RAG_SNAPSHOT_VERSION } from '@/constants'
import {
  compactChunkMetadataForExport,
  type RagSnapshotPayload,
  type RagSnapshotScope,
} from '@/lib/ai/rag-snapshot'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Exporta la base de conocimiento RAG (categorías, documentos, árboles ToC y chunks con embeddings)
 * en formato portátil JSON o JSON+GZIP (.json.gz).
 */
export async function GET(request: NextRequest) {
  const authCheck = await getAdminApiAuth()
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    )
  }

  try {
    const scopeParam = request.nextUrl.searchParams.get('scope')
    const formatParam = request.nextUrl.searchParams.get('format')
    const scope: RagSnapshotScope = scopeParam === 'all' ? 'all' : 'indexed'
    const isGzip = formatParam !== 'json'

    const [categories, documents] = await Promise.all([
      prisma.topicCategory.findMany({
        orderBy: { order: 'asc' },
      }),
      prisma.document.findMany({
        where: scope === 'indexed' ? { status: 'INDEXED' } : undefined,
        include: {
          category: { select: { code: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    if (documents.length === 0) {
      return NextResponse.json(
        {
          error:
            scope === 'indexed'
              ? 'No hay documentos INDEXED para exportar.'
              : 'No hay documentos registrados para exportar.',
        },
        { status: 404 }
      )
    }

    const docIds = documents.map((d) => d.id)
    const rawChunks = await prisma.documentChunk.findMany({
      where: { documentId: { in: docIds } },
      orderBy: [{ documentId: 'asc' }, { chunkIndex: 'asc' }],
    })

    let embeddedChunks = 0
    const exportedChunks = rawChunks.map((c) => {
      const { metadata, hasEmbedding } = compactChunkMetadataForExport(c.metadata)
      if (hasEmbedding) embeddedChunks++
      return {
        id: c.id,
        documentId: c.documentId,
        chunkIndex: c.chunkIndex,
        content: c.content,
        pageNumber: c.pageNumber,
        metadata,
        createdAt: c.createdAt.toISOString(),
      }
    })

    const payload: RagSnapshotPayload = {
      format: RAG_SNAPSHOT_FORMAT,
      version: RAG_SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
      scope,
      embeddingEncoding: 'f32-base64',
      stats: {
        categories: categories.length,
        documents: documents.length,
        chunks: exportedChunks.length,
        embeddedChunks,
      },
      categories: categories.map((cat) => ({
        code: cat.code,
        name: cat.name,
        description: cat.description,
        order: cat.order,
      })),
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        publicUrl: doc.publicUrl,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        status: doc.status,
        chunkCount: doc.chunkCount,
        categoryCode: doc.category?.code ?? null,
        tocTree: doc.tocTree ?? null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      })),
      chunks: exportedChunks,
    }

    const jsonString = JSON.stringify(payload)
    const dateStamp = new Date().toISOString().slice(0, 10)
    const fileName = `sipangpt-rag-${scope}-${dateStamp}.${isGzip ? 'json.gz' : 'json'}`

    const commonHeaders = {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
      'X-Snapshot-Scope': scope,
      'X-Snapshot-Documents': String(documents.length),
      'X-Snapshot-Chunks': String(exportedChunks.length),
      'X-Snapshot-Embedded-Chunks': String(embeddedChunks),
    }

    if (isGzip) {
      const gzipped = gzipSync(Buffer.from(jsonString, 'utf8'), { level: 6 })
      return new NextResponse(Uint8Array.from(gzipped), {
        status: 200,
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/gzip',
        },
      })
    }

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (err: unknown) {
    console.error('[API_ADMIN_DOCS_EXPORT_ERROR]', err)
    const message =
      err instanceof Error ? err.message : 'Error interno al exportar el snapshot RAG.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

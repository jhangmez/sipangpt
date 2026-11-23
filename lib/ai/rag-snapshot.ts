import type { DocumentStatus } from '@/lib/prisma'
import {
  RAG_SNAPSHOT_FORMAT,
  RAG_SNAPSHOT_VALID_STATUSES,
  RAG_SNAPSHOT_VERSION,
} from '@/constants'

export type RagSnapshotScope = 'indexed' | 'all'
export type RagSnapshotImportMode = 'replace' | 'merge'
export type RagSnapshotEmbeddingEncoding = 'f32-base64' | 'json-array'

export interface RagSnapshotCategory {
  code: string
  name: string
  description: string | null
  order: number
}

export interface RagSnapshotDocument {
  id: string
  title: string
  fileName: string
  fileUrl: string | null
  publicUrl: string | null
  mimeType: string
  sizeBytes: number
  status: DocumentStatus
  chunkCount: number
  categoryCode: string | null
  tocTree: unknown | null
  createdAt: string
  updatedAt: string
}

export interface RagSnapshotChunk {
  id: string
  documentId: string
  chunkIndex: number
  content: string
  pageNumber: number | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface RagSnapshotStats {
  categories: number
  documents: number
  chunks: number
  embeddedChunks: number
}

export interface RagSnapshotPayload {
  format: typeof RAG_SNAPSHOT_FORMAT
  version: number
  exportedAt: string
  scope: RagSnapshotScope
  embeddingEncoding: RagSnapshotEmbeddingEncoding
  stats: RagSnapshotStats
  categories: RagSnapshotCategory[]
  documents: RagSnapshotDocument[]
  chunks: RagSnapshotChunk[]
}

const VALID_STATUS_SET = new Set<string>(RAG_SNAPSHOT_VALID_STATUSES)

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNumericEmbeddingArray(value: unknown): value is number[] {
  if (!Array.isArray(value) || value.length === 0) return false
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'number' || !Number.isFinite(value[i])) {
      return false
    }
  }
  return true
}

/**
 * Codifica un vector embedding float64[] a representación binaria Float32 little-endian en Base64.
 * Reduce el tamaño de JSON en ~55% sin pérdida significativa de similitud coseno.
 */
export function encodeEmbeddingToF32Base64(embedding: number[]): string {
  const buffer = new ArrayBuffer(embedding.length * 4)
  const view = new DataView(buffer)
  for (let i = 0; i < embedding.length; i++) {
    view.setFloat32(i * 4, embedding[i], true)
  }

  const bytes = new Uint8Array(buffer)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64')
  }

  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...slice)
  }
  return btoa(binary)
}

/**
 * Decodifica un string Base64 Float32 little-endian al arreglo number[] requerido por PostgreSQL.
 */
export function decodeF32Base64ToEmbedding(b64: string): number[] {
  const trimmed = b64.trim()
  if (!trimmed) {
    throw new Error('El embedding codificado en Base64 está vacío.')
  }

  let bytes: Uint8Array
  if (typeof Buffer !== 'undefined') {
    bytes = Uint8Array.from(Buffer.from(trimmed, 'base64'))
  } else {
    const binary = atob(trimmed)
    bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
  }

  if (bytes.byteLength === 0 || bytes.byteLength % 4 !== 0) {
    throw new Error(
      `Longitud de bytes inválida (${bytes.byteLength}) para decodificar embedding Float32.`
    )
  }

  const count = bytes.byteLength / 4
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const result = new Array<number>(count)
  for (let i = 0; i < count; i++) {
    result[i] = view.getFloat32(i * 4, true)
  }
  return result
}

/**
 * Compacta los metadatos de un DocumentChunk para exportación,
 * reemplazando `embedding: number[]` por `embedding_f32_b64: string` y preservando todas las demás claves.
 */
export function compactChunkMetadataForExport(metadata: unknown): {
  metadata: Record<string, unknown> | null
  hasEmbedding: boolean
} {
  if (!isPlainRecord(metadata)) {
    return { metadata: null, hasEmbedding: false }
  }

  const nextMeta: Record<string, unknown> = { ...metadata }

  if (isNumericEmbeddingArray(nextMeta.embedding)) {
    nextMeta.embedding_f32_b64 = encodeEmbeddingToF32Base64(nextMeta.embedding)
    delete nextMeta.embedding
    return { metadata: nextMeta, hasEmbedding: true }
  }

  if (
    typeof nextMeta.embedding_f32_b64 === 'string' &&
    nextMeta.embedding_f32_b64.trim().length > 0
  ) {
    delete nextMeta.embedding
    return { metadata: nextMeta, hasEmbedding: true }
  }

  return { metadata: nextMeta, hasEmbedding: false }
}

/**
 * Hidrata los metadatos de un chunk antes de insertarlo en PostgreSQL,
 * reconstruyendo `metadata.embedding` como `number[]` a partir de `embedding_f32_b64` (si existe).
 */
export function hydrateChunkMetadataForDb(
  metadata: unknown
): Record<string, unknown> | null {
  if (!isPlainRecord(metadata)) {
    return null
  }

  const nextMeta: Record<string, unknown> = { ...metadata }

  if (
    typeof nextMeta.embedding_f32_b64 === 'string' &&
    nextMeta.embedding_f32_b64.trim().length > 0
  ) {
    nextMeta.embedding = decodeF32Base64ToEmbedding(nextMeta.embedding_f32_b64)
    delete nextMeta.embedding_f32_b64
  } else if (isNumericEmbeddingArray(nextMeta.embedding)) {
    nextMeta.embedding = [...nextMeta.embedding]
    delete nextMeta.embedding_f32_b64
  }

  return nextMeta
}

/**
 * Verifica si los metadatos de un chunk contienen un vector embedding (compacto o JSON).
 */
export function chunkHasEmbedding(metadata: unknown): boolean {
  if (!isPlainRecord(metadata)) return false
  if (
    typeof metadata.embedding_f32_b64 === 'string' &&
    metadata.embedding_f32_b64.trim().length > 0
  ) {
    return true
  }
  return isNumericEmbeddingArray(metadata.embedding)
}

/**
 * Valida estructuralmente un snapshot JSON antes de previsualizarlo o importarlo.
 */
export function validateRagSnapshotPayload(
  raw: unknown
): { ok: true; data: RagSnapshotPayload } | { ok: false; error: string } {
  if (!isPlainRecord(raw)) {
    return { ok: false, error: 'El archivo no contiene un objeto JSON válido.' }
  }

  if (raw.format !== RAG_SNAPSHOT_FORMAT) {
    return {
      ok: false,
      error: `Formato no reconocido. Se esperaba "${RAG_SNAPSHOT_FORMAT}".`,
    }
  }

  if (typeof raw.version !== 'number' || (raw.version !== 1 && raw.version !== RAG_SNAPSHOT_VERSION)) {
    return {
      ok: false,
      error: `Versión de snapshot no soportada (${String(raw.version)}).`,
    }
  }

  if (!Array.isArray(raw.categories)) {
    return { ok: false, error: 'El snapshot no incluye un arreglo válido en "categories".' }
  }

  if (!Array.isArray(raw.documents) || raw.documents.length === 0) {
    return {
      ok: false,
      error: 'El snapshot no contiene documentos válidos para importar ("documents" vacío).',
    }
  }

  if (!Array.isArray(raw.chunks)) {
    return { ok: false, error: 'El snapshot no incluye un arreglo válido en "chunks".' }
  }

  const categories: RagSnapshotCategory[] = []
  for (let i = 0; i < raw.categories.length; i++) {
    const cat = raw.categories[i]
    if (
      !isPlainRecord(cat) ||
      typeof cat.code !== 'string' ||
      !cat.code.trim() ||
      typeof cat.name !== 'string' ||
      !cat.name.trim()
    ) {
      return {
        ok: false,
        error: `Categoría inválida en la posición ${i}.`,
      }
    }
    categories.push({
      code: cat.code.trim(),
      name: cat.name.trim(),
      description: typeof cat.description === 'string' ? cat.description : null,
      order: typeof cat.order === 'number' && Number.isFinite(cat.order) ? cat.order : i,
    })
  }

  const documents: RagSnapshotDocument[] = []
  const docIdSet = new Set<string>()
  for (let i = 0; i < raw.documents.length; i++) {
    const doc = raw.documents[i]
    if (!isPlainRecord(doc)) {
      return { ok: false, error: `Documento inválido en la posición ${i}.` }
    }
    if (
      typeof doc.id !== 'string' ||
      !doc.id.trim() ||
      typeof doc.title !== 'string' ||
      !doc.title.trim() ||
      typeof doc.fileName !== 'string' ||
      !doc.fileName.trim() ||
      typeof doc.mimeType !== 'string' ||
      !doc.mimeType.trim()
    ) {
      return {
        ok: false,
        error: `Documento #${i + 1} incompleto (id, title, fileName o mimeType faltante).`,
      }
    }
    if (typeof doc.status !== 'string' || !VALID_STATUS_SET.has(doc.status)) {
      return {
        ok: false,
        error: `Estado inválido "${String(doc.status)}" en documento "${doc.title}".`,
      }
    }
    const id = doc.id.trim()
    if (docIdSet.has(id)) {
      return {
        ok: false,
        error: `ID de documento duplicado en el snapshot: "${id}".`,
      }
    }
    docIdSet.add(id)

    documents.push({
      id,
      title: doc.title.trim(),
      fileName: doc.fileName.trim(),
      fileUrl: typeof doc.fileUrl === 'string' ? doc.fileUrl : null,
      publicUrl: typeof doc.publicUrl === 'string' ? doc.publicUrl : null,
      mimeType: doc.mimeType.trim(),
      sizeBytes:
        typeof doc.sizeBytes === 'number' && Number.isFinite(doc.sizeBytes)
          ? Math.max(0, Math.round(doc.sizeBytes))
          : 0,
      status: doc.status as DocumentStatus,
      chunkCount:
        typeof doc.chunkCount === 'number' && Number.isFinite(doc.chunkCount)
          ? Math.max(0, Math.round(doc.chunkCount))
          : 0,
      categoryCode: typeof doc.categoryCode === 'string' ? doc.categoryCode.trim() : null,
      tocTree: doc.tocTree ?? null,
      createdAt:
        typeof doc.createdAt === 'string' && doc.createdAt
          ? doc.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof doc.updatedAt === 'string' && doc.updatedAt
          ? doc.updatedAt
          : new Date().toISOString(),
    })
  }

  const chunks: RagSnapshotChunk[] = []
  let embeddedChunks = 0
  for (let i = 0; i < raw.chunks.length; i++) {
    const ch = raw.chunks[i]
    if (!isPlainRecord(ch)) {
      return { ok: false, error: `Fragmento inválido en la posición ${i}.` }
    }
    if (
      typeof ch.id !== 'string' ||
      !ch.id.trim() ||
      typeof ch.documentId !== 'string' ||
      !docIdSet.has(ch.documentId.trim()) ||
      typeof ch.chunkIndex !== 'number' ||
      !Number.isFinite(ch.chunkIndex) ||
      typeof ch.content !== 'string'
    ) {
      return {
        ok: false,
        error: `Fragmento #${i + 1} corrupto o con documentId huérfano ("${String(ch.documentId)}").`,
      }
    }

    const meta = isPlainRecord(ch.metadata) ? ch.metadata : null
    if (chunkHasEmbedding(meta)) {
      embeddedChunks++
    }

    chunks.push({
      id: ch.id.trim(),
      documentId: ch.documentId.trim(),
      chunkIndex: Math.trunc(ch.chunkIndex),
      content: ch.content,
      pageNumber:
        typeof ch.pageNumber === 'number' && Number.isFinite(ch.pageNumber)
          ? Math.trunc(ch.pageNumber)
          : null,
      metadata: meta,
      createdAt:
        typeof ch.createdAt === 'string' && ch.createdAt
          ? ch.createdAt
          : new Date().toISOString(),
    })
  }

  const scope: RagSnapshotScope = raw.scope === 'all' ? 'all' : 'indexed'
  const embeddingEncoding: RagSnapshotEmbeddingEncoding =
    raw.embeddingEncoding === 'json-array' ? 'json-array' : 'f32-base64'

  return {
    ok: true,
    data: {
      format: RAG_SNAPSHOT_FORMAT,
      version: raw.version,
      exportedAt:
        typeof raw.exportedAt === 'string' && raw.exportedAt
          ? raw.exportedAt
          : new Date().toISOString(),
      scope,
      embeddingEncoding,
      stats: {
        categories: categories.length,
        documents: documents.length,
        chunks: chunks.length,
        embeddedChunks,
      },
      categories,
      documents,
      chunks,
    },
  }
}

/**
 * Constantes de exportación e importación portátil de Snapshots RAG Sipán-STAIR
 */

export const RAG_SNAPSHOT_FORMAT = 'sipangpt-rag-snapshot' as const

export const RAG_SNAPSHOT_VERSION = 2 as const

// 40 chunks con f32-base64 (~680 KB por lote) evitan límites de proxy (ej. 1 MB Nginx)
export const RAG_SNAPSHOT_IMPORT_BATCH_SIZE = 40

// Límite defensivo máximo de fragmentos aceptados por petición POST
export const RAG_SNAPSHOT_MAX_CHUNKS_PER_BATCH = 100

export const RAG_SNAPSHOT_VALID_STATUSES = [
  'PROCESSING',
  'INDEXED',
  'DEINDEXED',
  'ERROR',
] as const

'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { Role } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CACHE_PATHS } from '@/constants'

export interface SystemSettingsData {
  id: string
  maxPromptChars: number
  maxDailyTokensPerUser: number
  enableVoiceInput: boolean
  enableRAG: boolean
  enableWebSearch: boolean
  enableMapsSearch: boolean
  enableImageAnalysis: boolean
  minSimilarityScore: number
  maintenanceMode: boolean
  updatedAt: string
}

/**
 * Obtiene la configuración del sistema global (inicializándola si no existe)
 * Incluye fallback directo a PostgreSQL para soportar instancias en memoria de Turbopack
 */
export async function getSystemSettingsAction(): Promise<SystemSettingsData> {
  await requireRole(Role.ADMIN)

  try {
    const setting = await prisma.systemSetting.upsert({
      where: { id: 'global_config' },
      create: {
        id: 'global_config',
        maxPromptChars: 2000,
        maxDailyTokensPerUser: 50000,
        enableVoiceInput: true,
        enableRAG: true,
        enableWebSearch: false,
        enableMapsSearch: false,
        enableImageAnalysis: true,
        minSimilarityScore: 0.5,
        maintenanceMode: false,
      },
      update: {},
    })

    return {
      id: setting.id,
      maxPromptChars: setting.maxPromptChars,
      maxDailyTokensPerUser: setting.maxDailyTokensPerUser,
      enableVoiceInput: setting.enableVoiceInput,
      enableRAG: setting.enableRAG ?? true,
      enableWebSearch: setting.enableWebSearch ?? false,
      enableMapsSearch: setting.enableMapsSearch ?? false,
      enableImageAnalysis: setting.enableImageAnalysis ?? true,
      minSimilarityScore: setting.minSimilarityScore ?? 0.5,
      maintenanceMode: setting.maintenanceMode,
      updatedAt: setting.updatedAt.toISOString(),
    }
  } catch {
    try {
      const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
        SELECT * FROM system_settings WHERE id = 'global_config' LIMIT 1
      `
      if (rows && rows.length > 0) {
        const row = rows[0]
        return {
          id: String(row.id || 'global_config'),
          maxPromptChars: Number(row.max_prompt_chars ?? 2000),
          maxDailyTokensPerUser: Number(row.max_daily_tokens_per_user ?? 50000),
          enableVoiceInput: Boolean(row.enable_voice_input ?? true),
          enableRAG: Boolean(row.enable_rag ?? true),
          enableWebSearch: Boolean(row.enable_web_search ?? false),
          enableMapsSearch: Boolean(row.enable_maps_search ?? false),
          enableImageAnalysis: Boolean(row.enable_image_analysis ?? true),
          minSimilarityScore: Number(row.min_similarity_score ?? 0.5),
          maintenanceMode: Boolean(row.maintenance_mode ?? false),
          updatedAt: (row.updated_at ? new Date(String(row.updated_at)) : new Date()).toISOString(),
        }
      }

      await prisma.$executeRaw`
        INSERT INTO system_settings (id, max_prompt_chars, max_daily_tokens_per_user, enable_voice_input, enable_rag, enable_web_search, enable_maps_search, enable_image_analysis, min_similarity_score, maintenance_mode, updated_at)
        VALUES ('global_config', 2000, 50000, true, true, false, false, true, 0.50, false, NOW())
        ON CONFLICT (id) DO NOTHING
      `

      return {
        id: 'global_config',
        maxPromptChars: 2000,
        maxDailyTokensPerUser: 50000,
        enableVoiceInput: true,
        enableRAG: true,
        enableWebSearch: false,
        enableMapsSearch: false,
        enableImageAnalysis: true,
        minSimilarityScore: 0.5,
        maintenanceMode: false,
        updatedAt: new Date().toISOString(),
      }
    } catch (dbErr) {
      console.error('[SETTINGS_FALLBACK_ERROR]', dbErr)
      return {
        id: 'global_config',
        maxPromptChars: 2000,
        maxDailyTokensPerUser: 50000,
        enableVoiceInput: true,
        enableRAG: true,
        enableWebSearch: false,
        enableMapsSearch: false,
        enableImageAnalysis: true,
        minSimilarityScore: 0.5,
        maintenanceMode: false,
        updatedAt: new Date().toISOString(),
      }
    }
  }
}

/**
 * Actualiza las políticas de búsqueda, RAG y límites del sistema
 */
export async function updateSystemSettingsAction(
  data: Partial<{
    maxPromptChars: number
    maxDailyTokensPerUser: number
    enableVoiceInput: boolean
    enableRAG: boolean
    enableWebSearch: boolean
    enableMapsSearch: boolean
    enableImageAnalysis: boolean
    minSimilarityScore: number
    maintenanceMode: boolean
  }>
): Promise<{ success: boolean; message: string }> {
  await requireRole(Role.ADMIN)

  try {
    try {
      await prisma.systemSetting.upsert({
        where: { id: 'global_config' },
        create: {
          id: 'global_config',
          ...data,
        },
        update: {
          ...data,
        },
      })
    } catch {
      // Fallback SQL directo si la instancia en caliente aún no refrescó los campos
      await prisma.$executeRaw`
        UPDATE system_settings
        SET 
          enable_rag = COALESCE(${data.enableRAG}, enable_rag),
          enable_web_search = COALESCE(${data.enableWebSearch}, enable_web_search),
          enable_maps_search = COALESCE(${data.enableMapsSearch}, enable_maps_search),
          enable_image_analysis = COALESCE(${data.enableImageAnalysis}, enable_image_analysis),
          min_similarity_score = COALESCE(${data.minSimilarityScore}, min_similarity_score),
          max_daily_tokens_per_user = COALESCE(${data.maxDailyTokensPerUser}, max_daily_tokens_per_user),
          max_prompt_chars = COALESCE(${data.maxPromptChars}, max_prompt_chars),
          enable_voice_input = COALESCE(${data.enableVoiceInput}, enable_voice_input),
          maintenance_mode = COALESCE(${data.maintenanceMode}, maintenance_mode),
          updated_at = NOW()
        WHERE id = 'global_config'
      `
    }

    revalidatePath(CACHE_PATHS.ADMIN_SETTINGS)
    revalidatePath(CACHE_PATHS.ADMIN_MODELS)
    revalidatePath(CACHE_PATHS.CHAT)

    return {
      success: true,
      message: 'Configuración de búsqueda e IA actualizada correctamente.',
    }
  } catch (err: any) {
    console.error('[UPDATE_SYSTEM_SETTINGS_ERROR]', err)
    return {
      success: false,
      message: err?.message || 'Error al guardar la configuración.',
    }
  }
}

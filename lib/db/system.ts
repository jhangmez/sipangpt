import { prisma } from '@/lib/prisma'
import { cache } from 'react'

/**
 * Obtiene los modelos de IA activos en el sistema
 */
export const getActiveAIModels = cache(async () => {
  return prisma.aIModelConfig.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  })
})

/**
 * Obtiene la configuración general del sistema
 */
export const getSystemSettings = cache(async () => {
  let settings = await prisma.systemSetting.findUnique({
    where: { id: 'global_config' },
  })

  if (!settings) {
    settings = await prisma.systemSetting.create({
      data: { id: 'global_config' },
    })
  }

  return settings
})

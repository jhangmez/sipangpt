import type { ModelProvider } from '@/lib/prisma'

export interface ModelDefinition {
  id: string
  name: string
  modelCode: string
  provider: ModelProvider
  description: string
  isDefault: boolean
}

export const DEFAULT_MODEL_CODE = 'gemini-2.5-flash'
export const DEFAULT_PROVIDER: ModelProvider = 'GEMINI'

export const SYSTEM_MODELS: ModelDefinition[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    modelCode: 'gemini-2.5-flash',
    provider: 'GEMINI',
    description: 'Modelo ultrarrápido y multimodal para consultas generales.',
    isDefault: true,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 2.5 Pro',
    modelCode: 'gemini-2.5-pro',
    provider: 'GEMINI',
    description: 'Modelo de razonamiento profundo para análisis de reglamentos extensos.',
    isDefault: false,
  },
  {
    id: 'local-mac',
    name: 'Llama 3.2 SipánGPT (Local)',
    modelCode: 'llama3.2:latest',
    provider: 'LOCAL_MAC',
    description: 'Modelo local optimizado ejecutado en Mac Mini M4.',
    isDefault: false,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    modelCode: 'gpt-4o-mini',
    provider: 'OPENAI',
    description: 'Modelo eficiente de OpenAI para respuestas rápidas.',
    isDefault: false,
  },
]

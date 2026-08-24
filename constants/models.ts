import type { ModelProvider, ModelStatus } from '@/lib/prisma'

export interface ModelDefinition {
  id: string
  name: string
  modelCode: string
  provider: ModelProvider
  description?: string | null
  status: ModelStatus
  latencyMs?: number | null
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
    description: 'Modelo oficial de alta velocidad y multimodal.',
    status: 'ONLINE',
    latencyMs: 180,
    isDefault: true,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 2.5 Pro',
    modelCode: 'gemini-2.5-pro',
    provider: 'GEMINI',
    description: 'Razonamiento complejo para normativas y tesis.',
    status: 'ONLINE',
    latencyMs: 450,
    isDefault: false,
  },
  {
    id: 'local-mac',
    name: 'Llama 3.2 SipánGPT (Local M4)',
    modelCode: 'llama3.2:latest',
    provider: 'LOCAL_MAC',
    description: 'Servidor local Mac Mini M4 mediante Cloudflare Tunnel.',
    status: 'ONLINE',
    latencyMs: 95,
    isDefault: false,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    modelCode: 'gpt-4o-mini',
    provider: 'OPENAI',
    description: 'Modelo eficiente de respaldo para consultas académicas.',
    status: 'DEGRADED',
    latencyMs: 920,
    isDefault: false,
  },
]

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
  inputPricePerMillion?: number
  outputPricePerMillion?: number
}

export const DEFAULT_MODEL_CODE = 'gemini-3.1-flash-lite'
export const DEFAULT_PROVIDER: ModelProvider = 'GEMINI'

export const SYSTEM_MODELS: ModelDefinition[] = [
  {
    id: 'gemini-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    modelCode: 'gemini-3.1-flash-lite',
    provider: 'GEMINI',
    description:
      'Nuestro modelo más rentable, optimizado para tareas de agentes de gran volumen, traducción y respuestas rápidas.',
    status: 'ONLINE',
    latencyMs: 140,
    isDefault: true,
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.30,
  },
  {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    modelCode: 'gemini-2.5-flash',
    provider: 'GEMINI',
    description: 'Modelo oficial multimodal de alta velocidad y OCR.',
    status: 'ONLINE',
    latencyMs: 210,
    isDefault: false,
    inputPricePerMillion: 0.10,
    outputPricePerMillion: 0.40,
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
    inputPricePerMillion: 0.00,
    outputPricePerMillion: 0.00,
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
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
  },
]

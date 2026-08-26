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
export const DOCUMENT_TRANSCRIPTION_MODEL_CODE = 'gemini-3.1-flash-lite'

export const SYSTEM_MODELS: ModelDefinition[] = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    modelCode: 'gemini-3.1-flash-lite',
    provider: 'GEMINI',
    description:
      'Nuestro modelo más rentable y veloz, optimizado para tareas de agentes de gran volumen y respuestas en tiempo real.',
    status: 'ONLINE',
    latencyMs: 140,
    isDefault: true,
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.50,
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    modelCode: 'gemini-3.6-flash',
    provider: 'GEMINI',
    description: 'Modelo más inteligente de última generación creado para velocidad, búsqueda y fundamentación avanzada.',
    status: 'ONLINE',
    latencyMs: 210,
    isDefault: false,
    inputPricePerMillion: 1.50,
    outputPricePerMillion: 7.50,
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    modelCode: 'gemini-3.5-flash',
    provider: 'GEMINI',
    description: 'Inteligencia de vanguardia con alta velocidad y fundamentación.',
    status: 'ONLINE',
    latencyMs: 230,
    isDefault: false,
    inputPricePerMillion: 1.50,
    outputPricePerMillion: 9.00,
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    modelCode: 'gemini-3.5-flash-lite',
    provider: 'GEMINI',
    description: 'Modelo rentable para tareas masivas de agentes y procesamiento rápido.',
    status: 'ONLINE',
    latencyMs: 160,
    isDefault: false,
    inputPricePerMillion: 0.30,
    outputPricePerMillion: 2.50,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    modelCode: 'gemini-3.1-pro-preview',
    provider: 'GEMINI',
    description: 'Máximo rendimiento para comprensión multimodal profunda, vibe coding y razonamiento de agentes.',
    status: 'ONLINE',
    latencyMs: 480,
    isDefault: false,
    inputPricePerMillion: 2.00,
    outputPricePerMillion: 12.00,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    modelCode: 'gemini-2.5-pro',
    provider: 'GEMINI',
    description: 'Razonamiento complejo de estado del arte para normativas institucionales y análisis académico.',
    status: 'ONLINE',
    latencyMs: 450,
    isDefault: false,
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 10.00,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    modelCode: 'gemini-2.5-flash',
    provider: 'GEMINI',
    description: 'Modelo híbrido multimodal oficial para transcripción OCR de PDFs y razonamiento con pensamiento.',
    status: 'ONLINE',
    latencyMs: 220,
    isDefault: false,
    inputPricePerMillion: 0.30,
    outputPricePerMillion: 2.50,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    modelCode: 'gemini-2.5-flash-lite',
    provider: 'GEMINI',
    description: 'Modelo ultraligero y económico para alta concurrencia.',
    status: 'ONLINE',
    latencyMs: 130,
    isDefault: false,
    inputPricePerMillion: 0.10,
    outputPricePerMillion: 0.40,
  },
  {
    id: 'local-mac',
    name: 'Llama 3.2 SipánGPT (Local M4)',
    modelCode: 'llama3.2:latest',
    provider: 'LOCAL_MAC',
    description: 'Servidor local Mac Mini M4 mediante Cloudflare Tunnel (Costo cero de inferencia).',
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
    description: 'Modelo eficiente de respaldo de OpenAI para consultas académicas.',
    status: 'ONLINE',
    latencyMs: 380,
    isDefault: false,
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
  },
  {
    id: 'claude-3-5-sonnet-latest',
    name: 'Claude 3.5 Sonnet',
    modelCode: 'claude-3-5-sonnet-latest',
    provider: 'ANTHROPIC',
    description: 'Capacidades avanzadas de redacción y comprensión de textos normativos.',
    status: 'ONLINE',
    latencyMs: 520,
    isDefault: false,
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    modelCode: 'llama-3.3-70b-versatile',
    provider: 'GROQ',
    description: 'Inferencia a velocidad extrema impulsada por LPU en Groq Cloud.',
    status: 'ONLINE',
    latencyMs: 110,
    isDefault: false,
    inputPricePerMillion: 0.59,
    outputPricePerMillion: 0.79,
  },
]

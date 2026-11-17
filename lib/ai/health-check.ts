import { ModelProvider, ModelStatus } from '@/lib/prisma'

export interface ModelHealthStatus {
  status: ModelStatus
  latencyMs: number | null
  message: string
  details?: string
}

/**
 * Realiza un test de conectividad y latencia en tiempo real para un modelo
 * según su proveedor configurado (Ollama/Mac Mini, Google Gemini, OpenAI, Groq, etc.)
 */
export async function testModelConnectivity(model: {
  id: string
  provider: ModelProvider | string
  modelCode: string
  endpointUrl?: string | null
}): Promise<ModelHealthStatus> {
  const start = performance.now()

  try {
    switch (model.provider) {
      case ModelProvider.LOCAL_MAC: {
        // Determinar URL base de Ollama / Mac Mini M4
        const rawUrl =
          model.endpointUrl ||
          process.env.OLLAMA_BASE_URL ||
          process.env.NEXT_PUBLIC_OLLAMA_URL ||
          'http://localhost:11434'

        let cleanBase = rawUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '')
        if (!cleanBase.startsWith('http://') && !cleanBase.startsWith('https://')) {
          cleanBase = `https://${cleanBase}`
        }

        const pingUrl = `${cleanBase}/api/tags`
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 4000)

        try {
          const res = await fetch(pingUrl, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          const latencyMs = Math.round(performance.now() - start)

          if (res.ok) {
            const data = await res.json().catch(() => null)
            const modelsList = Array.isArray(data?.models) ? data.models : []
            const hasModel = modelsList.some(
              (m: any) =>
                m.name === model.modelCode ||
                m.name?.startsWith(model.modelCode) ||
                m.model?.startsWith(model.modelCode)
            )

            const status = latencyMs > 2000 ? ModelStatus.DEGRADED : ModelStatus.ONLINE
            const msg = hasModel
              ? `Túnel Mac Mini M4 conectado. Modelo ${model.modelCode} listo (${latencyMs}ms).`
              : `Túnel conectado (${modelsList.length} modelos en Ollama, ${latencyMs}ms).`

            return {
              status,
              latencyMs,
              message: msg,
              details: `Endpoint: ${cleanBase} (HTTP ${res.status})`,
            }
          } else {
            return {
              status: ModelStatus.OFFLINE,
              latencyMs: null,
              message: `Servidor respondió con código HTTP ${res.status} (${res.statusText || 'Error de túnel'}).`,
              details: `Endpoint: ${cleanBase}`,
            }
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId)
          const isTimeout = fetchErr?.name === 'AbortError'
          return {
            status: ModelStatus.OFFLINE,
            latencyMs: null,
            message: isTimeout
              ? 'Tiempo de espera agotado (>4000ms). Servidor Mac Mini o túnel Cloudflare no responde.'
              : 'Conexión rechazada. Servidor local Mac Mini o túnel Cloudflare desconectado.',
            details: `Endpoint: ${cleanBase} | Causa: ${fetchErr?.message || 'Inaccesible'}`,
          }
        }
      }

      case ModelProvider.GEMINI: {
        const apiKey =
          process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
        if (!apiKey) {
          return {
            status: ModelStatus.OFFLINE,
            latencyMs: null,
            message: 'Variable GEMINI_API_KEY no configurada en el servidor.',
          }
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 4000)
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1`,
            { signal: controller.signal }
          )
          clearTimeout(timeoutId)
          const latencyMs = Math.round(performance.now() - start)

          if (res.ok) {
            return {
              status: latencyMs > 2000 ? ModelStatus.DEGRADED : ModelStatus.ONLINE,
              latencyMs,
              message: `API de Google Gemini operativa (${latencyMs}ms).`,
            }
          } else {
            return {
              status: ModelStatus.OFFLINE,
              latencyMs: null,
              message: `Google AI respondió con error HTTP ${res.status}. Verifica la validez de tu API Key.`,
            }
          }
        } catch (err: any) {
          clearTimeout(timeoutId)
          return {
            status: ModelStatus.OFFLINE,
            latencyMs: null,
            message: `Error al conectar con Google AI: ${err?.message || 'Timeout'}`,
          }
        }
      }

      case ModelProvider.OPENAI: {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
          return {
            status: ModelStatus.OFFLINE,
            latencyMs: null,
            message: 'Variable OPENAI_API_KEY no configurada.',
          }
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 4000)
        try {
          const res = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
          const latencyMs = Math.round(performance.now() - start)

          if (res.ok) {
            return {
              status: latencyMs > 2000 ? ModelStatus.DEGRADED : ModelStatus.ONLINE,
              latencyMs,
              message: `API de OpenAI operativa (${latencyMs}ms).`,
            }
          } else {
            return {
              status: ModelStatus.OFFLINE,
              latencyMs: null,
              message: `OpenAI respondió con código HTTP ${res.status}.`,
            }
          }
        } catch (err: any) {
          clearTimeout(timeoutId)
          return {
            status: ModelStatus.OFFLINE,
            latencyMs: null,
            message: `Error al conectar con OpenAI: ${err?.message || 'Timeout'}`,
          }
        }
      }

      case ModelProvider.GROQ: {
        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
          return {
            status: ModelStatus.OFFLINE,
            latencyMs: null,
            message: 'Variable GROQ_API_KEY no configurada.',
          }
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 4000)
        try {
          const res = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
          const latencyMs = Math.round(performance.now() - start)

          if (res.ok) {
            return {
              status: latencyMs > 2000 ? ModelStatus.DEGRADED : ModelStatus.ONLINE,
              latencyMs,
              message: `API de Groq operativa (${latencyMs}ms).`,
            }
          } else {
            return {
              status: ModelStatus.OFFLINE,
              latencyMs: null,
              message: `Groq respondió con código HTTP ${res.status}.`,
            }
          }
        } catch (err: any) {
          clearTimeout(timeoutId)
          return {
            status: ModelStatus.OFFLINE,
            latencyMs: null,
            message: `Error al conectar con Groq: ${err?.message || 'Timeout'}`,
          }
        }
      }

      default: {
        if (model.endpointUrl) {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 4000)
          try {
            const res = await fetch(model.endpointUrl, {
              method: 'HEAD',
              signal: controller.signal,
            })
            clearTimeout(timeoutId)
            const latencyMs = Math.round(performance.now() - start)
            return {
              status: latencyMs > 2000 ? ModelStatus.DEGRADED : ModelStatus.ONLINE,
              latencyMs,
              message: `Endpoint personalizado activo (HTTP ${res.status}, ${latencyMs}ms).`,
            }
          } catch (err: any) {
            clearTimeout(timeoutId)
            return {
              status: ModelStatus.OFFLINE,
              latencyMs: null,
              message: `Endpoint inaccesible: ${err?.message || 'Fallo de conexión'}`,
            }
          }
        }

        return {
          status: ModelStatus.DEGRADED,
          latencyMs: null,
          message: `Proveedor ${model.provider} sin comprobación de ping automatizada.`,
        }
      }
    }
  } catch (error: any) {
    return {
      status: ModelStatus.OFFLINE,
      latencyMs: null,
      message: `Error al evaluar conectividad: ${error?.message || 'Error desconocido'}`,
    }
  }
}

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOllama } from 'ollama-ai-provider-v2'
import type { LanguageModel } from 'ai'
import { ModelProvider } from '@/lib/prisma'
import { DEFAULT_MODEL_CODE, DEFAULT_PROVIDER } from '@/constants/models'

// Google Gemini Provider
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '',
})

// OpenAI Provider
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Ollama / Local Provider (Mac Mini M4 vía Tunnel o Localhost)
export function getOllamaProvider(baseURL?: string | null) {
  return createOllama({
    baseURL: baseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api',
  })
}

/**
 * Factory unificado para resolver cualquier modelo dinámicamente según el proveedor configurado
 */
export function getLanguageModel(
  provider: ModelProvider | string = DEFAULT_PROVIDER,
  modelCode: string = DEFAULT_MODEL_CODE,
  endpointUrl?: string | null
): LanguageModel {
  switch (provider) {
    case ModelProvider.LOCAL_MAC: {
      const ollama = getOllamaProvider(endpointUrl)
      return ollama(modelCode || 'llama3.2:latest')
    }

    case ModelProvider.GEMINI: {
      return google(modelCode || DEFAULT_MODEL_CODE)
    }

    case ModelProvider.OPENAI: {
      return openai(modelCode || 'gpt-4o-mini')
    }

    default: {
      if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) {
        return google(modelCode || DEFAULT_MODEL_CODE)
      }
      if (process.env.OPENAI_API_KEY) {
        return openai(modelCode || 'gpt-4o-mini')
      }
      const ollama = getOllamaProvider(endpointUrl)
      return ollama(modelCode || 'llama3.2:latest')
    }
  }
}

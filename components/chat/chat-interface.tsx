'use client'

import * as React from 'react'
import { Bot, User, Sparkles, AlertCircle, ArrowUp, RefreshCw } from 'lucide-react'
import { ModelSelector } from './model-selector'
import type { ModelDefinition } from '@/constants/models'
import type { AIModelConfig, Pregunta } from '@/lib/prisma'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: number
}

interface ChatInterfaceProps {
  initialConversationId?: string
  userName?: string | null
  models?: AIModelConfig[]
  questions?: Pregunta[]
}

export function ChatInterface({
  initialConversationId,
  userName,
  models = [],
  questions = [],
}: ChatInterfaceProps) {
  // Mapear los modelos de la base de datos a la estructura del selector
  const mappedModels: ModelDefinition[] = models.map((m) => ({
    id: m.id,
    name: m.name,
    modelCode: m.modelCode,
    provider: m.provider,
    description: m.description || '',
    status: m.status,
    latencyMs: m.latencyMs ?? undefined,
    isDefault: m.isDefault,
  }))

  const defaultModel = mappedModels.find((m) => m.isDefault) || mappedModels[0] || {
    id: 'default',
    name: 'Gemini 2.5 Flash',
    modelCode: 'gemini-2.5-flash',
    provider: 'GEMINI' as const,
    description: 'Modelo oficial por defecto',
    status: 'ONLINE' as const,
    latencyMs: 180,
    isDefault: true,
  }

  const [selectedModel, setSelectedModel] = React.useState<ModelDefinition>(defaultModel)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim()
    if (!messageContent || isLoading) return

    setError(null)
    setInput('')

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      createdAt: Date.now(),
    }

    const assistantMessageId = `assistant-${Date.now()}`
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages([...updatedMessages, initialAssistantMessage])
    setIsLoading(true)

    try {
      const payloadMessages = updatedMessages.map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: 'text', text: m.content }],
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          conversationId: initialConversationId,
          modelCode: selectedModel.modelCode,
          provider: selectedModel.provider,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No se recibió flujo de respuesta del servidor.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line) continue
          if (line.startsWith('0:')) {
            try {
              const textPart = JSON.parse(line.slice(2))
              accumulatedText += textPart
            } catch {
              accumulatedText += line.slice(2)
            }
          } else if (!line.startsWith('{') && !line.startsWith('d:') && !line.startsWith('e:')) {
            accumulatedText += line
          }
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedText.trim() || '...' }
              : msg
          )
        )
      }
    } catch (err: any) {
      console.error('[CHAT_ERROR]', err)
      setError(err?.message || 'Ocurrió un error al procesar tu consulta.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  return (
    <div className='flex flex-col h-full w-full max-w-4xl mx-auto'>
      {/* Barra Superior: Selector de Modelo y Estado de Salud */}
      <header className='flex items-center justify-between border-b border-border/40 pb-3 px-4 shrink-0'>
        <div className='flex items-center gap-3'>
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            models={mappedModels.length > 0 ? mappedModels : undefined}
          />
        </div>
        <div className='text-xs text-muted-foreground font-exo hidden sm:block'>
          IA Oficial USS con RAG Institucional
        </div>
      </header>

      {/* Historial de Mensajes / Pantalla Inicial */}
      <div className='flex-1 overflow-y-auto p-4 space-y-6'>
        {messages.length === 0 ? (
          <div className='flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 max-w-md mx-auto'>
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'>
              <Bot className='h-8 w-8' />
            </div>

            <div className='space-y-2'>
              <h1 className='font-frances text-2xl sm:text-3xl font-bold text-foreground'>
                ¡Hola, {userName || 'Estudiante'}!
              </h1>
              <p className='text-sm text-muted-foreground font-exo'>
                ¿En qué puedo orientarte hoy sobre la Universidad Señor de Sipán?
              </p>
            </div>

            {/* Preguntas Sugeridas Iniciales Dinámicas desde Base de Datos */}
            {questions.length > 0 && (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2'>
                {questions.map((q) => (
                  <button
                    key={q.id}
                    type='button'
                    onClick={() => handleSendMessage(q.text)}
                    className='flex items-start gap-2.5 rounded-2xl border border-border/70 bg-card/60 p-3 text-xs font-exo text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all shadow-xs'
                  >
                    <span className='text-base shrink-0'>{q.icon}</span>
                    <span className='line-clamp-2 leading-relaxed'>{q.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user'
            return (
              <div
                key={message.id}
                className={cn('flex gap-3.5 max-w-3xl', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs',
                    isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted border border-border/60 text-foreground'
                  )}
                >
                  {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4 text-primary' />}
                </div>

                {/* Burbuja de Mensaje */}
                <div className='space-y-2 max-w-[85%] sm:max-w-xl'>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm font-exo leading-relaxed shadow-xs',
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border/60 text-foreground'
                    )}
                  >
                    <div className='whitespace-pre-wrap'>{message.content}</div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Indicador de Carga */}
        {isLoading && (
          <div className='flex gap-3 max-w-xl mr-auto'>
            <div className='h-8 w-8 rounded-xl bg-muted border border-border/60 flex items-center justify-center shrink-0'>
              <Bot className='h-4 w-4 text-primary animate-spin' />
            </div>
            <div className='rounded-2xl bg-card border border-border/60 px-4 py-3 text-xs text-muted-foreground font-exo flex items-center gap-2'>
              <span className='h-2 w-2 rounded-full bg-primary animate-ping' />
              Consultando reglamentos USS y generando respuesta...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className='rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-4 w-4 shrink-0' />
              <span>{error}</span>
            </div>
            <button
              type='button'
              onClick={() => handleSendMessage()}
              className='flex items-center gap-1 font-semibold hover:underline'
            >
              <RefreshCw className='h-3.5 w-3.5' /> Reintentar
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Barra de Entrada de Consulta */}
      <form onSubmit={handleSubmit} className='p-4 border-t border-border/40 shrink-0 bg-background/80 backdrop-blur-md'>
        <div className='relative flex items-center'>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Escribe tu consulta sobre trámites, carreras, matrícula o reglamentos...'
            className='w-full rounded-2xl border border-border/80 bg-card px-4 py-3.5 pr-12 text-sm font-exo text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all'
            disabled={isLoading}
          />
          <button
            type='submit'
            disabled={isLoading || !input.trim()}
            className='absolute right-2 rounded-xl bg-primary p-2.5 text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
          >
            <ArrowUp className='h-4 w-4' />
          </button>
        </div>
        <p className='text-[11px] text-muted-foreground text-center font-exo pt-2'>
          SipánGPT puede cometer errores. Verifica información importante con los reglamentos institucionales oficiales.
        </p>
      </form>
    </div>
  )
}

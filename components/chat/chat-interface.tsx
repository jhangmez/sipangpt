'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport
} from '@/components/ui/message-scroller'
import { ChatHeader } from './chat-header'
import { ChatEmptyState } from './chat-empty-state'
import { ChatMessageItem } from './chat-message-item'
import { ChatLoadingItem } from './chat-loading-item'
import { ChatErrorAlert } from './chat-error-alert'
import { ChatAttachmentsPreview } from './chat-attachments-preview'
import { ChatInputForm } from './chat-input-form'
import { FeedbackModal } from './feedback-modal'
import { ChatSidePanel } from './chat-side-panel'
import {
  SYSTEM_MODELS,
  DEFAULT_MODEL_CODE,
  type ModelDefinition
} from '@/constants/models'
import { getErrorMessage } from '@/lib/utils'
import {
  INITIAL_QUESTIONS,
  type SuggestedQuestionDefinition
} from '@/constants/questions'
import type {
  ChatMessage,
  AttachedFile,
  FeedbackState,
  MessageSource
} from '@/types/chat'
import type { PostItem } from '@/types'
import type { User } from 'next-auth'

interface ChatInterfaceProps {
  initialMessages?: ChatMessage[]
  user?:
    | (User & {
        role?: string
        firstName?: string | null
        lastName?: string | null
      })
    | null
  userName?: string | null
  conversationId?: string
  models?: ModelDefinition[]
  posts?: PostItem[]
  questions?: Array<{
    id: string
    text: string
    category?: string | null
    icon: string
    order: number
  }>
}

export function ChatInterface({
  initialMessages = [],
  user,
  userName = 'Estudiante USS',
  conversationId,
  models = [],
  posts = [],
  questions = []
}: ChatInterfaceProps) {
  // Mapeo defensivo de modelos de IA
  const mappedModels: ModelDefinition[] = React.useMemo(() => {
    if (!models || models.length === 0) return SYSTEM_MODELS
    return models
  }, [models])

  // Mapeo defensivo de preguntas sugeridas
  const mappedQuestions: SuggestedQuestionDefinition[] = React.useMemo(() => {
    if (!questions || questions.length === 0) return INITIAL_QUESTIONS
    return questions.map((q) => ({
      id: q.id,
      text: q.text,
      category: q.category || 'general',
      icon: q.icon
    }))
  }, [questions])

  // Estado del modelo activo seleccionado
  const [selectedModel, setSelectedModel] = React.useState<ModelDefinition>(
    () => {
      const defaultModel = mappedModels.find(
        (m) => m.isDefault && m.status === 'ONLINE'
      )
      if (defaultModel) return defaultModel
      const firstOnline = mappedModels.find((m) => m.status === 'ONLINE')
      if (firstOnline) return firstOnline
      return mappedModels[0] || SYSTEM_MODELS[0]
    }
  )

  // Sincronización si cambian los modelos
  React.useEffect(() => {
    if (mappedModels.length > 0) {
      const currentStillExists = mappedModels.find(
        (m) => m.id === selectedModel.id
      )
      if (!currentStillExists) {
        const nextDefault =
          mappedModels.find((m) => m.isDefault) || mappedModels[0]
        setSelectedModel(nextDefault)
      }
    }
  }, [mappedModels, selectedModel.id])
  const router = useRouter()
  const [currentConversationId, setCurrentConversationId] = React.useState<
    string | undefined
  >(conversationId)

  // Estados del chat
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [attachedFiles, setAttachedFiles] = React.useState<AttachedFile[]>([])

  // Sincronizar mensajes e ID si cambian las props iniciales
  React.useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

  React.useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId)
    }
  }, [conversationId])

  // Estados del modal de feedback
  const [feedbackModalOpen, setFeedbackModalOpen] = React.useState(false)
  const [feedbackData, setFeedbackData] = React.useState<FeedbackState | null>(
    null
  )

  // Obtener fuentes iniciales si existen mensajes previos
  const initialSources = React.useMemo(() => {
    const lastAssistant = [...initialMessages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.sources && m.sources.length > 0)
    return lastAssistant?.sources || []
  }, [initialMessages])

  // Estados del panel lateral derecho reutilizable (Novedades USS & Fuentes RAG)
  // Se oculta si ya existen mensajes o no hay posts disponibles
  const [sidePanelOpen, setSidePanelOpen] = React.useState<boolean>(() => {
    if (initialMessages.length > 0) {
      return initialSources.length > 0
    }
    return posts.length > 0
  })
  const [sidePanelTab, setSidePanelTab] = React.useState<'posts' | 'sources'>(
    () => {
      if (initialMessages.length > 0 && initialSources.length > 0) {
        return 'sources'
      }
      return 'posts'
    }
  )
  const [activeSources, setActiveSources] =
    React.useState<MessageSource[]>(initialSources)

  // Sincronizar fuentes si el último mensaje del asistente las contiene
  React.useEffect(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.sources && m.sources.length > 0)
    if (lastAssistant?.sources && lastAssistant.sources.length > 0) {
      setActiveSources((prev) => {
        if (prev.length === lastAssistant.sources?.length) return prev
        return lastAssistant.sources!
      })
    }
  }, [messages])

  // Abrir modal de feedback interactivo
  const handleOpenFeedback = (
    message: ChatMessage,
    type: 'Adecuada' | 'Inadecuada' | null,
    rating?: number
  ) => {
    setFeedbackData({
      messageId: message.id,
      userQuestion:
        [...messages].reverse().find((m) => m.role === 'user')?.content ||
        'Consulta',
      assistantResponse: message.content,
      modelName: message.modelName || selectedModel.name,
      type,
      initialRating: rating
    })
    setFeedbackModalOpen(true)
  }

  // Calificar mensaje localmente tras enviar feedback
  const handleRateMessage = (messageId: string, rating: number) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, rating } : msg))
    )
  }

  // Copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Texto copiado al portapapeles')
  }

  // Manejo de archivos adjuntos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: AttachedFile[] = Array.from(files).map((file: File) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || 'documento',
      file,
    }))
    setAttachedFiles((prev) => [...prev, ...newFiles])
    toast.success(`${newFiles.length} archivo(s) adjuntado(s)`)
  }

  const removeAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // Helper para leer archivo en base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.includes(',') ? result.split(',')[1] : result
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Envío e inferencia de consulta con streaming en tiempo real
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (
      textOverride !== undefined ? textOverride : input
    ).trim()
    if (!textToSend && attachedFiles.length === 0) return

    // Al realizar una pregunta, ocultar la sección de publicaciones/posts si está activa
    if (sidePanelTab === 'posts') {
      setSidePanelOpen(false)
    }

    setError(null)
    const userMessageId = crypto.randomUUID()
    const nowIso = new Date().toISOString()

    const attachmentsForUi = attachedFiles.map((att) => ({
      id: att.id,
      name: att.name,
      size: att.size,
      type: att.type
    }))

    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      createdAt: nowIso,
      attachments: attachmentsForUi.length > 0 ? attachmentsForUi : undefined
    }

    const currentAttachments = [...attachedFiles]
    setMessages((prev) => [...prev, newUserMessage])
    setInput('')
    setAttachedFiles([])
    setIsLoading(true)

    try {
      // Preparar payload de archivos con contenido en base64
      const attachmentsPayload = await Promise.all(
        currentAttachments.map(async (att) => {
          let base64Data: string | undefined = undefined
          try {
            base64Data = await readFileAsBase64(att.file)
          } catch {
            // Continuar sin base64 si no es legible
          }
          return {
            id: att.id,
            name: att.name,
            size: att.size,
            type: att.type,
            data: base64Data
          }
        })
      )

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationId: currentConversationId,
          modelCode: selectedModel.modelCode,
          provider: selectedModel.provider,
          attachments: attachmentsPayload
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(
          errData?.error || 'Error al conectar con el asistente de IA'
        )
      }

      // Sincronizar nuevo ID de conversación desde los encabezados de respuesta
      const headerConvId = response.headers.get('x-conversation-id')
      if (headerConvId && headerConvId !== currentConversationId) {
        setCurrentConversationId(headerConvId)
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes(headerConvId)
        ) {
          window.history.replaceState(null, '', `/chat/${headerConvId}`)
        }
      }

      // Procesar flujo de respuesta en tiempo real (SSE)
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No se pudo inicializar el flujo de datos del modelo.')
      }

      let assistantAdded = false
      const assistantTempId = crypto.randomUUID()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEvent = ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim()
            continue
          }

          if (trimmed.startsWith('data: ') || trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace(/^data:\s*/, '')
            if (dataStr === '[DONE]') continue

            try {
              const packet = JSON.parse(dataStr)

              // 1. Manejo de paquete 'start' o metadatos iniciales
              if (packet.type === 'start' && packet.messageMetadata) {
                const meta = packet.messageMetadata
                if (
                  meta.conversationId &&
                  meta.conversationId !== currentConversationId
                ) {
                  setCurrentConversationId(meta.conversationId)
                  if (
                    typeof window !== 'undefined' &&
                    !window.location.pathname.includes(meta.conversationId)
                  ) {
                    window.history.replaceState(
                      null,
                      '',
                      `/chat/${meta.conversationId}`
                    )
                  }
                }
                if (meta.sources && meta.sources.length > 0) {
                  setActiveSources(meta.sources)
                  setSidePanelTab('sources')
                  setSidePanelOpen(true)
                }
              }

              // 2. Manejo de chunks de texto (soporta 'delta' de AI SDK 7.x, 'textDelta' y 'text')
              const textDelta =
                packet.delta !== undefined
                  ? packet.delta
                  : packet.textDelta !== undefined
                    ? packet.textDelta
                    : packet.text !== undefined
                      ? packet.text
                      : currentEvent === 'delta'
                        ? packet.text
                        : null

              if (textDelta) {
                accumulatedText += textDelta
                if (!assistantAdded) {
                  assistantAdded = true
                  const newAssistantMsg: ChatMessage = {
                    id: assistantTempId,
                    role: 'assistant',
                    content: accumulatedText,
                    createdAt: new Date().toISOString(),
                    modelName: selectedModel.name,
                    modelProvider: selectedModel.provider,
                    latencyMs: selectedModel.latencyMs || 140
                  }
                  setMessages((prev) => [...prev, newAssistantMsg])
                } else {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantTempId
                        ? { ...msg, content: accumulatedText }
                        : msg
                    )
                  )
                }
              }

              // 3. Manejo de razonamiento CoT en streaming
              if (packet.type === 'reasoning-delta') {
                const rDelta = packet.delta ?? packet.textDelta
                if (rDelta) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantTempId
                        ? { ...msg, reasoning: (msg.reasoning || '') + rDelta }
                        : msg
                    )
                  )
                }
              }

              // 4. Manejo de fuentes y metadatos complementarios
              if (packet.type === 'source' && packet.source) {
                setActiveSources((prev) => [...prev, packet.source])
                setSidePanelTab('sources')
                setSidePanelOpen(true)
              }

              if (currentEvent === 'meta' || packet.type === 'metadata') {
                const metaSources =
                  packet.sources || packet.messageMetadata?.sources
                if (metaSources && metaSources.length > 0) {
                  setActiveSources(metaSources)
                  setSidePanelTab('sources')
                  setSidePanelOpen(true)
                }
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantTempId
                      ? {
                          ...msg,
                          id: packet.id || msg.id,
                          sources: metaSources || msg.sources,
                          latencyMs: packet.latencyMs || msg.latencyMs,
                          retrievalLatencyMs:
                            packet.retrievalLatencyMs || msg.retrievalLatencyMs,
                          generationLatencyMs:
                            packet.generationLatencyMs ||
                            msg.generationLatencyMs,
                          embeddingModel:
                            packet.embeddingModel ||
                            msg.embeddingModel ||
                            'gemini-embedding-2',
                          modelName: packet.modelName || selectedModel.name
                        }
                      : msg
                  )
                )
              }

              if (
                packet.type === 'finish' &&
                packet.messageMetadata?.conversationId
              ) {
                const finishConvId = packet.messageMetadata.conversationId
                if (finishConvId !== currentConversationId) {
                  setCurrentConversationId(finishConvId)
                  if (
                    typeof window !== 'undefined' &&
                    !window.location.pathname.includes(finishConvId)
                  ) {
                    window.history.replaceState(
                      null,
                      '',
                      `/chat/${finishConvId}`
                    )
                  }
                }
              }

              if (packet.type === 'error' || currentEvent === 'error') {
                throw new Error(
                  packet.error || 'Error reportado por el modelo de IA.'
                )
              }
            } catch (parseErr: unknown) {
              if (trimmed.includes('"error"')) {
                throw parseErr
              }
            }
          }
        }
      }

      // Actualizar datos del servidor para que el historial en el sidebar muestre la nueva conversación
      router.refresh()
    } catch (err: unknown) {
      console.error('[CHAT_ERROR]', err)
      const rawErrMsg = getErrorMessage(err)
      const friendlyMsg = rawErrMsg?.includes('API key')
        ? rawErrMsg
        : 'Estamos experimentando problemas, por favor intenta nuevamente en unos instantes.'
      setError(friendlyMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const userDisplayName =
    user?.firstName || user?.name || userName || 'Estudiante USS'
  const userImage = user?.image || undefined

  return (
    <>
      <ChatHeader
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        models={mappedModels.length > 0 ? mappedModels : undefined}
      />
      <div className='flex flex-1 h-full w-full overflow-hidden min-h-0'>
        {/* Contenedor Central del Chat */}
        <div className='flex flex-col h-full w-full max-w-4xl mx-auto select-text font-exo flex-1 min-w-0'>
          {/* Scroll de Mensajes con MessageScroller */}
          <MessageScrollerProvider
            autoScroll
            defaultScrollPosition='last-anchor'
          >
            <MessageScroller className='flex-1 overflow-hidden'>
              <MessageScrollerViewport className='p-4'>
                <MessageScrollerContent>
                  {messages.length === 0 ? (
                    <ChatEmptyState
                      userDisplayName={userDisplayName}
                      questions={mappedQuestions}
                      onSelectQuestion={handleSendMessage}
                    />
                  ) : (
                    messages.map((message) => (
                      <ChatMessageItem
                        key={message.id}
                        message={message}
                        userDisplayName={userDisplayName}
                        userImage={userImage}
                        selectedModel={selectedModel}
                        onCopy={copyToClipboard}
                        onRegenerate={() => handleSendMessage()}
                        onOpenFeedback={handleOpenFeedback}
                        onShowSources={(srcs) => {
                          setActiveSources(srcs)
                          setSidePanelTab('sources')
                          setSidePanelOpen(true)
                        }}
                      />
                    ))
                  )}

                  {/* Indicador de Carga mientras se espera la primera respuesta */}
                  {isLoading &&
                    messages[messages.length - 1]?.role === 'user' && (
                      <ChatLoadingItem />
                    )}

                  {/* Alerta de Error */}
                  {error && (
                    <ChatErrorAlert
                      error={error}
                      onRetry={() => handleSendMessage()}
                    />
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>

          {/* Previsualización de Archivos Adjuntos antes del envío */}
          <ChatAttachmentsPreview
            files={attachedFiles}
            onRemove={removeAttachment}
          />

          {/* Formulario de Consulta con InputGroup auto-expandible */}
          <ChatInputForm
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            hasAttachments={attachedFiles.length > 0}
            onSubmit={() => handleSendMessage()}
            onFileUpload={handleFileUpload}
          />

          {/* Modal de Feedback Oficial USS */}
          {feedbackData && (
            <FeedbackModal
              isOpen={feedbackModalOpen}
              setIsOpen={setFeedbackModalOpen}
              userQuestion={feedbackData.userQuestion}
              assistantResponse={feedbackData.assistantResponse}
              messageId={feedbackData.messageId}
              modelName={feedbackData.modelName}
              userId={user?.id}
              feedbackType={feedbackData.type}
              setFeedbackType={(t) =>
                setFeedbackData((prev) => (prev ? { ...prev, type: t } : null))
              }
              initialRating={feedbackData.initialRating}
              onRatingChange={(r) =>
                handleRateMessage(feedbackData.messageId, r)
              }
            />
          )}
        </div>

        {/* Panel Vertical a la Derecha: Novedades & Fuentes Oficiales */}
        <ChatSidePanel
          posts={posts}
          activeSources={activeSources}
          activeTab={sidePanelTab}
          onTabChange={setSidePanelTab}
          isOpen={sidePanelOpen}
          onToggleOpen={() => setSidePanelOpen(!sidePanelOpen)}
        />
      </div>
    </>
  )
}

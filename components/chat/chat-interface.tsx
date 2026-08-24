'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { ChatHeader } from './chat-header'
import { ChatEmptyState } from './chat-empty-state'
import { ChatMessageItem } from './chat-message-item'
import { ChatLoadingItem } from './chat-loading-item'
import { ChatErrorAlert } from './chat-error-alert'
import { ChatAttachmentsPreview } from './chat-attachments-preview'
import { ChatInputForm } from './chat-input-form'
import { FeedbackModal } from './feedback-modal'
import {
  SYSTEM_MODELS,
  DEFAULT_MODEL_CODE,
  type ModelDefinition,
} from '@/constants/models'
import {
  INITIAL_QUESTIONS,
  type SuggestedQuestionDefinition,
} from '@/constants/questions'
import type { ChatMessage, AttachedFile, FeedbackState } from '@/types/chat'
import type { User } from 'next-auth'

interface ChatInterfaceProps {
  initialMessages?: ChatMessage[]
  user?: (User & { role?: string; firstName?: string | null; lastName?: string | null }) | null
  userName?: string | null
  conversationId?: string
  models?: Array<{
    id: string
    name: string
    modelCode: string
    provider: any
    description?: string | null
    status: any
    latencyMs?: number | null
    isDefault: boolean
  }>
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
  questions = [],
}: ChatInterfaceProps) {
  // Mapeo defensivo de modelos de IA
  const mappedModels: ModelDefinition[] = React.useMemo(() => {
    if (!models || models.length === 0) return SYSTEM_MODELS
    return models.map((m) => ({
      id: m.id,
      name: m.name,
      modelCode: m.modelCode,
      provider: m.provider,
      description: m.description || '',
      status: m.status,
      latencyMs: m.latencyMs ?? undefined,
      isDefault: m.isDefault,
    }))
  }, [models])

  // Mapeo defensivo de preguntas sugeridas
  const mappedQuestions: SuggestedQuestionDefinition[] = React.useMemo(() => {
    if (!questions || questions.length === 0) return INITIAL_QUESTIONS
    return questions.map((q) => ({
      id: q.id,
      text: q.text,
      category: q.category || 'general',
      icon: q.icon,
    }))
  }, [questions])

  // Estado del modelo activo seleccionado
  const [selectedModel, setSelectedModel] = React.useState<ModelDefinition>(() => {
    const defaultModel = mappedModels.find((m) => m.isDefault && m.status === 'ONLINE')
    if (defaultModel) return defaultModel
    const firstOnline = mappedModels.find((m) => m.status === 'ONLINE')
    if (firstOnline) return firstOnline
    return mappedModels[0] || SYSTEM_MODELS[0]
  })

  // Sincronización si cambian los modelos
  React.useEffect(() => {
    if (mappedModels.length > 0) {
      const currentStillExists = mappedModels.find((m) => m.id === selectedModel.id)
      if (!currentStillExists) {
        const nextDefault = mappedModels.find((m) => m.isDefault) || mappedModels[0]
        setSelectedModel(nextDefault)
      }
    }
  }, [mappedModels, selectedModel.id])

  // Estados del chat
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [attachedFiles, setAttachedFiles] = React.useState<AttachedFile[]>([])

  // Estados del modal de feedback
  const [feedbackModalOpen, setFeedbackModalOpen] = React.useState(false)
  const [feedbackData, setFeedbackData] = React.useState<FeedbackState | null>(null)

  // Abrir modal de feedback interactivo
  const handleOpenFeedback = (
    message: ChatMessage,
    type: 'Adecuada' | 'Inadecuada' | null,
    rating?: number
  ) => {
    const messageIndex = messages.findIndex((m) => m.id === message.id)
    const userQuestion =
      messageIndex > 0 && messages[messageIndex - 1].role === 'user'
        ? messages[messageIndex - 1].content
        : 'Consulta sobre trámites y normativas de la USS'

    setFeedbackData({
      messageId: message.id,
      userQuestion,
      assistantResponse: message.content,
      modelName: message.modelName || selectedModel.name,
      type: type || (rating && rating >= 4 ? 'Adecuada' : 'Inadecuada'),
      initialRating: rating || (type === 'Adecuada' ? 5 : 1),
    })
    setFeedbackModalOpen(true)
  }

  // Calificar mensaje localmente tras enviar feedback
  const handleRateMessage = (messageId: string, rating: number) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, rating } : msg))
    )
  }

  // Copiar mensaje al portapapeles con toast
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success('Mensaje copiado!')
  }

  // Manejo de carga de archivos adjuntos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
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

  // Envío e inferencia de consulta
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input
    if ((!textToSend.trim() && attachedFiles.length === 0) || isLoading) return

    setError(null)
    const userMessageId = crypto.randomUUID()
    const nowIso = new Date().toISOString()

    const attachmentsForMessage = attachedFiles.map((att) => ({
      id: att.id,
      name: att.name,
      size: att.size,
      type: att.type,
    }))

    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      createdAt: nowIso,
      attachments: attachmentsForMessage.length > 0 ? attachmentsForMessage : undefined,
    }

    setMessages((prev) => [...prev, newUserMessage])
    setInput('')
    setAttachedFiles([])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationId,
          modelCode: selectedModel.modelCode,
          provider: selectedModel.provider,
          attachments: attachmentsForMessage,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error || 'Error al conectar con el asistente')
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: data.id || crypto.randomUUID(),
        role: 'assistant',
        content: data.response || data.content,
        createdAt: data.createdAt || new Date().toISOString(),
        modelName: selectedModel.name,
        modelProvider: selectedModel.provider,
        reasoning: data.reasoning,
        latencyMs: data.latencyMs || selectedModel.latencyMs || 180,
        sources: data.sources,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      console.error('[CHAT_ERROR]', err)
      setError(err?.message || 'Ocurrió un error al procesar tu consulta.')
    } finally {
      setIsLoading(false)
    }
  }

  const userDisplayName = user?.firstName || user?.name || userName || 'Estudiante USS'
  const userImage = user?.image || undefined

  return (
    <div className='flex flex-col h-full w-full max-w-4xl mx-auto select-text font-exo'>
      {/* 1. Header de Controles y Selector de Modelo */}
      <ChatHeader
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        models={mappedModels.length > 0 ? mappedModels : undefined}
      />

      {/* 2. Scroll de Mensajes con MessageScroller */}
      <MessageScrollerProvider autoScroll defaultScrollPosition='last-anchor'>
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
                  />
                ))
              )}

              {/* Indicador de Carga */}
              {isLoading && <ChatLoadingItem />}

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

      {/* 3. Previsualización de Archivos Adjuntos antes del envío */}
      <ChatAttachmentsPreview
        files={attachedFiles}
        onRemove={removeAttachment}
      />

      {/* 4. Formulario de Consulta con InputGroup auto-expandible */}
      <ChatInputForm
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        hasAttachments={attachedFiles.length > 0}
        onSubmit={() => handleSendMessage()}
        onFileUpload={handleFileUpload}
      />

      {/* 5. Modal de Feedback Oficial USS */}
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
          onRatingChange={(r) => handleRateMessage(feedbackData.messageId, r)}
        />
      )}
    </div>
  )
}

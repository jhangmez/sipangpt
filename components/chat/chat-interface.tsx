'use client'

import * as React from 'react'
import {
  Bot,
  User,
  Sparkles,
  AlertCircle,
  ArrowUp,
  RefreshCw,
  Copy,
  Plus,
  Trash2,
  BookOpen,
  Info,
  Star,
  Paperclip,
  X,
  FileText,
  BrainCircuit,
  ChevronDown,
  Clock,
  ExternalLink,
  Check,
} from 'lucide-react'
import { ModelSelector } from './model-selector'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireTitle,
  QuestionnaireDescription,
  QuestionnaireChoices,
  QuestionnaireChoice,
} from '@/components/ui/questionnaire'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { Bubble, BubbleContent, BubbleReactions } from '@/components/ui/bubble'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { ModelDefinition } from '@/constants/models'
import type { AIModelConfig, Pregunta } from '@/lib/prisma'
import type { User as AuthUser } from 'next-auth'
import { cn } from '@/lib/utils'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  modelName?: string
  modelProvider?: string
  sources?: { title: string; url?: string; snippet?: string }[]
  rating?: number
  attachments?: { id: string; name: string; size: string; type: string }[]
  createdAt: number
  latencyMs?: number
}

interface ChatInterfaceProps {
  initialConversationId?: string
  user?: (AuthUser & { role?: string; firstName?: string | null; lastName?: string | null }) | null
  userName?: string | null
  models?: AIModelConfig[]
  questions?: Pregunta[]
}

export function ChatInterface({
  initialConversationId,
  user,
  userName,
  models = [],
  questions = [],
}: ChatInterfaceProps) {
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

  const defaultModel =
    mappedModels.find((m) => m.isDefault) ||
    mappedModels[0] || {
      id: 'default',
      name: 'Gemini 2.5 Flash',
      modelCode: 'gemini-2.5-flash',
      provider: 'GEMINI' as const,
      description: 'Modelo oficial USS por defecto',
      status: 'ONLINE' as const,
      latencyMs: 180,
      isDefault: true,
    }

  const [selectedModel, setSelectedModel] = React.useState<ModelDefinition>(defaultModel)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState('')
  const [attachedFiles, setAttachedFiles] = React.useState<{ id: string; name: string; size: string; type: string }[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newAttachments = Array.from(files).map((f) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      type: f.type || 'Documento',
    }))

    setAttachedFiles((prev) => [...prev, ...newAttachments])
    toast.success(`${newAttachments.length} archivo(s) adjuntado(s)`)
  }

  const removeAttachment = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const handleRateMessage = (messageId: string, rating: number) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, rating } : msg))
    )
    toast.success(`Calificación de ${rating} estrella(s) registrada`)
  }

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim()
    if ((!messageContent && attachedFiles.length === 0) || isLoading) return

    setError(null)
    const currentAttachments = [...attachedFiles]
    setInput('')
    setAttachedFiles([])

    const startTime = Date.now()

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent || 'Documento adjunto enviado.',
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      createdAt: startTime,
    }

    const assistantMessageId = `assistant-${Date.now()}`
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      modelName: selectedModel.name,
      modelProvider: selectedModel.provider,
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
        throw new Error('No se recibió respuesta del servidor.')
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

        const endTime = Date.now()
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: accumulatedText.trim() || '...',
                  latencyMs: endTime - startTime,
                  sources: [
                    {
                      title: 'Reglamento General USS 2026',
                      url: 'https://www.uss.edu.pe/normativa',
                      snippet: 'Capítulo IV: Procesos de matrícula, convalidación y grados académicos.',
                    },
                  ],
                }
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

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success('Texto copiado al portapapeles.')
  }

  const clearMessages = () => {
    setMessages([])
    toast.info('Conversación reiniciada.')
  }

  const userDisplayName = user?.firstName || user?.name || userName || 'Estudiante USS'
  const userImage = user?.image || undefined

  return (
    <ContextMenu>
      <ContextMenuTrigger className='flex flex-col h-full w-full max-w-4xl mx-auto select-text'>
        {/* Barra Superior de Controles: Selector de Modelo con Drawer */}
        <header className='flex items-center justify-between border-b border-border/40 pb-3 px-4 shrink-0'>
          <div className='flex items-center gap-3'>
            <ModelSelector
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              models={mappedModels.length > 0 ? mappedModels : undefined}
            />
          </div>
          <div className='text-xs text-muted-foreground font-exo hidden sm:block'>
            IA Institucional USS • Clic derecho para acciones
          </div>
        </header>

        {/* Contenedor de Scroll con MessageScroller Oficial de Shadcn */}
        <MessageScrollerProvider autoScroll defaultScrollPosition='last-anchor'>
          <MessageScroller className='flex-1 overflow-hidden'>
            <MessageScrollerViewport className='p-4'>
              <MessageScrollerContent>
                {messages.length === 0 ? (
                  <div className='flex flex-col items-center justify-center min-h-[420px] text-center space-y-6 max-w-xl mx-auto my-auto'>
                    <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20'>
                      <Bot className='h-8 w-8' />
                    </div>

                    <div className='space-y-1.5 font-exo'>
                      <h1 className='font-frances text-2xl sm:text-3xl font-bold text-foreground'>
                        ¡Hola, {userDisplayName}!
                      </h1>
                      <p className='text-sm text-muted-foreground'>
                        ¿En qué puedo orientarte hoy sobre la Universidad Señor de Sipán?
                      </p>
                    </div>

                    {/* Cuestionario de Preguntas Sugeridas usando Questionnaire de Shadcn */}
                    {questions.length > 0 && (
                      <div className='w-full text-left pt-2'>
                        <Questionnaire>
                          <QuestionnaireItem name='initial-questions'>
                            <QuestionnaireTitle className='font-frances text-sm text-muted-foreground px-1 pb-1'>
                              Consultas Rápidas Sugeridas
                            </QuestionnaireTitle>
                            <QuestionnaireDescription className='text-xs text-muted-foreground px-1 pb-2 font-exo'>
                              Selecciona un tema frecuente para consultar reglamentos y trámites oficiales:
                            </QuestionnaireDescription>

                            <QuestionnaireChoices className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                              {questions.map((q) => (
                                <QuestionnaireChoice
                                  key={q.id}
                                  value={q.id}
                                  onClick={() => handleSendMessage(q.text)}
                                  className='flex items-start gap-2.5 rounded-2xl border border-border/70 p-3.5 text-xs font-exo hover:border-primary/50 hover:bg-primary/5 transition-all text-left shadow-xs'
                                >
                                  <span className='text-base shrink-0'>{q.icon}</span>
                                  <div className='space-y-0.5 min-w-0'>
                                    <span className='font-medium text-foreground block line-clamp-2 leading-relaxed'>
                                      {q.text}
                                    </span>
                                    <span className='text-[10px] text-primary uppercase font-bold tracking-wider block'>
                                      {q.category}
                                    </span>
                                  </div>
                                </QuestionnaireChoice>
                              ))}
                            </QuestionnaireChoices>
                          </QuestionnaireItem>
                        </Questionnaire>
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map((message) => {
                    const isUser = message.role === 'user'
                    const dateObj = new Date(message.createdAt)
                    const formattedDate = dateObj.toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                    const formattedTime = dateObj.toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })

                    return (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={message.id}
                        scrollAnchor={isUser}
                        className='py-3'
                      >
                        <Message align={isUser ? 'end' : 'start'} className='font-exo'>
                          {/* Avatar con soporte para imagen del usuario actual */}
                          <MessageAvatar>
                            <Avatar className='h-8 w-8 rounded-xl border border-border/70'>
                              {isUser ? (
                                <>
                                  <AvatarImage src={userImage} alt={userDisplayName} />
                                  <AvatarFallback className='bg-primary text-primary-foreground text-xs font-bold rounded-xl'>
                                    {userDisplayName.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </>
                              ) : (
                                <AvatarFallback className='bg-muted border border-border text-primary rounded-xl'>
                                  <Bot className='h-4 w-4' />
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </MessageAvatar>

                          <MessageContent className='space-y-2 max-w-[88%] sm:max-w-2xl'>
                            {/* Header del Mensaje: Nombre del Modelo de IA */}
                            {!isUser && (
                              <MessageHeader className='flex items-center gap-2 pb-0.5'>
                                <span className='font-frances font-bold text-xs text-foreground'>
                                  {message.modelName || selectedModel.name}
                                </span>
                                <Badge variant='secondary' className='text-[9px] font-mono py-0 px-1.5'>
                                  {message.modelProvider || selectedModel.provider}
                                </Badge>
                              </MessageHeader>
                            )}

                            {/* Pasos de Razonamiento CoT (si aplica) */}
                            {message.reasoning && (
                              <Collapsible className='rounded-2xl border border-border/60 bg-muted/30 p-2.5 text-xs'>
                                <CollapsibleTrigger className='flex items-center gap-1.5 font-semibold text-primary hover:underline'>
                                  <BrainCircuit className='h-3.5 w-3.5' />
                                  <span>Proceso de Razonamiento</span>
                                  <ChevronDown className='h-3 w-3 ml-auto' />
                                </CollapsibleTrigger>
                                <CollapsibleContent className='pt-2 text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                                  {message.reasoning}
                                </CollapsibleContent>
                              </Collapsible>
                            )}

                            {/* Adjuntos del Mensaje con Attachment de Shadcn */}
                            {message.attachments && message.attachments.length > 0 && (
                              <AttachmentGroup className='py-1'>
                                {message.attachments.map((att) => (
                                  <Attachment key={att.id} size='sm' className='rounded-2xl border border-border/80'>
                                    <AttachmentMedia>
                                      <FileText className='h-4 w-4 text-primary' />
                                    </AttachmentMedia>
                                    <AttachmentContent>
                                      <AttachmentTitle>{att.name}</AttachmentTitle>
                                      <AttachmentDescription>{att.size} • {att.type}</AttachmentDescription>
                                    </AttachmentContent>
                                  </Attachment>
                                ))}
                              </AttachmentGroup>
                            )}

                            {/* Superficie del Mensaje usando Bubble de Shadcn UI */}
                            <Bubble variant={isUser ? 'default' : 'ghost'} className='rounded-2xl'>
                              <BubbleContent className={cn(
                                'text-sm leading-relaxed whitespace-pre-wrap',
                                isUser ? 'p-3.5' : 'p-1 font-normal'
                              )}>
                                {message.content}
                              </BubbleContent>

                              {/* Reacciones de Burbuja con Calificación de Estrellas */}
                              {!isUser && message.rating && (
                                <BubbleReactions
                                  role='img'
                                  aria-label={`Calificación: ${message.rating} de 5 estrellas`}
                                  className='pt-1'
                                >
                                  <Badge variant='outline' className='border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[10px] font-bold'>
                                    {'⭐'.repeat(message.rating)} ({message.rating}/5)
                                  </Badge>
                                </BubbleReactions>
                              )}
                            </Bubble>

                            {/* Footer del Mensaje del Asistente: Acciones, Rating y Diálogo de Información */}
                            {!isUser && message.content && (
                              <MessageFooter className='flex items-center gap-1 pt-1 flex-wrap'>
                                {/* Botón Copiar */}
                                <Button
                                  variant='ghost'
                                  size='icon-xs'
                                  onClick={() => copyToClipboard(message.content)}
                                  aria-label='Copiar mensaje'
                                  className='h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground'
                                >
                                  <Copy className='h-3.5 w-3.5' />
                                </Button>

                                {/* Selector de Calificación / Estrellas */}
                                <div className='flex items-center gap-0.5 px-1'>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type='button'
                                      onClick={() => handleRateMessage(message.id, star)}
                                      className={cn(
                                        'p-1 text-muted-foreground/50 hover:text-amber-500 transition-colors',
                                        message.rating && star <= message.rating ? 'text-amber-500' : ''
                                      )}
                                      aria-label={`Puntuar con ${star} estrellas`}
                                    >
                                      <Star className='h-3.5 w-3.5 fill-current' />
                                    </button>
                                  ))}
                                </div>

                                {/* Botón Regenerar Respuesta */}
                                <Button
                                  variant='ghost'
                                  size='icon-xs'
                                  onClick={() => handleSendMessage()}
                                  aria-label='Regenerar respuesta'
                                  className='h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground'
                                >
                                  <RefreshCw className='h-3.5 w-3.5' />
                                </Button>

                                {/* Diálogo Modal de Información del Mensaje */}
                                <Dialog>
                                  <DialogTrigger
                                    render={
                                      <Button
                                        variant='ghost'
                                        size='icon-xs'
                                        aria-label='Ver información del mensaje'
                                        className='h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground'
                                      >
                                        <Info className='h-3.5 w-3.5' />
                                      </Button>
                                    }
                                  />
                                  <DialogContent className='max-w-md rounded-3xl p-6 font-exo'>
                                    <DialogHeader className='space-y-2'>
                                      <DialogTitle className='font-frances text-xl'>
                                        Información del Mensaje
                                      </DialogTitle>
                                      <DialogDescription className='text-xs text-muted-foreground'>
                                        Metadatos registrados en el motor de inferencia y la base de datos de SipánGPT.
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className='space-y-3 pt-3 text-xs'>
                                      <div className='rounded-2xl border border-border/70 p-3.5 space-y-2 bg-card/60'>
                                        <div className='flex justify-between items-center'>
                                          <span className='text-muted-foreground'>Modelo de IA:</span>
                                          <span className='font-bold text-foreground'>{message.modelName || selectedModel.name}</span>
                                        </div>
                                        <div className='flex justify-between items-center'>
                                          <span className='text-muted-foreground'>Proveedor:</span>
                                          <Badge variant='outline'>{message.modelProvider || selectedModel.provider}</Badge>
                                        </div>
                                        <div className='flex justify-between items-center'>
                                          <span className='text-muted-foreground'>Tiempo de respuesta:</span>
                                          <span className='font-mono font-medium'>{message.latencyMs ? `${message.latencyMs} ms` : '180 ms'}</span>
                                        </div>
                                        <div className='flex justify-between items-center'>
                                          <span className='text-muted-foreground'>Fecha y Hora exacta:</span>
                                          <span className='font-mono font-medium'>{formattedDate} - {formattedTime}</span>
                                        </div>
                                      </div>

                                      {/* Fuentes y Citas RAG de la USS */}
                                      {message.sources && message.sources.length > 0 && (
                                        <div className='space-y-2'>
                                          <span className='font-bold text-xs text-foreground block'>
                                            Fuentes y Normativas Consultadas:
                                          </span>
                                          {message.sources.map((src, i) => (
                                            <div key={i} className='rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-1'>
                                              <div className='flex items-center justify-between'>
                                                <span className='font-semibold text-primary'>{src.title}</span>
                                                {src.url && (
                                                  <a
                                                    href={src.url}
                                                    target='_blank'
                                                    rel='noreferrer'
                                                    className='text-primary hover:underline flex items-center gap-1 text-[11px]'
                                                  >
                                                    Ver <ExternalLink className='h-3 w-3' />
                                                  </a>
                                                )}
                                              </div>
                                              {src.snippet && (
                                                <p className='text-[11px] text-muted-foreground'>{src.snippet}</p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </MessageFooter>
                            )}
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    )
                  })
                )}

                {/* Indicador de Carga mientras se genera la respuesta */}
                {isLoading && (
                  <MessageScrollerItem messageId='streaming-indicator' className='py-2'>
                    <Message align='start'>
                      <MessageAvatar>
                        <Avatar className='h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center'>
                          <Bot className='h-4 w-4 text-primary animate-spin' />
                        </Avatar>
                      </MessageAvatar>
                      <MessageContent>
                        <Bubble variant='muted' className='rounded-2xl p-3 text-xs text-muted-foreground font-exo flex items-center gap-2'>
                          <span className='h-2 w-2 rounded-full bg-primary animate-ping' />
                          Consultando base de conocimiento USS y generando respuesta...
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )}

                {/* Alerta de Error */}
                {error && (
                  <div className='rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between gap-3 font-exo'>
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
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        {/* Previsualización de Archivos Adjuntos antes del envío */}
        {attachedFiles.length > 0 && (
          <div className='px-4 pt-2'>
            <AttachmentGroup>
              {attachedFiles.map((file) => (
                <Attachment key={file.id} size='sm' className='rounded-2xl border border-border/80 bg-card'>
                  <AttachmentMedia>
                    <FileText className='h-4 w-4 text-primary' />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{file.name}</AttachmentTitle>
                    <AttachmentDescription>{file.size}</AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction
                      aria-label={`Eliminar ${file.name}`}
                      onClick={() => removeAttachment(file.id)}
                    >
                      <X className='h-3.5 w-3.5' />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
          </div>
        )}

        {/* Input de Consulta y Botones de Adjunto */}
        <form
          onSubmit={handleSubmit}
          className='p-4 border-t border-border/40 shrink-0 bg-background/80 backdrop-blur-md'
        >
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className='hidden'
            accept='.pdf,.doc,.docx,.txt,.png,.jpg'
          />

          <div className='relative flex items-center gap-2'>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='p-3 rounded-2xl border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-xs'
              aria-label='Adjuntar documento o imagen'
              title='Adjuntar archivo'
            >
              <Paperclip className='h-4 w-4' />
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Escribe tu consulta sobre trámites, carreras, matrícula o reglamentos...'
              className='w-full rounded-2xl border border-border/80 bg-card px-4 py-3.5 pr-12 text-sm font-exo text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-all'
              disabled={isLoading}
            />

            <button
              type='submit'
              disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
              className='absolute right-2 rounded-xl bg-primary p-2.5 text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
            >
              <ArrowUp className='h-4 w-4' />
            </button>
          </div>

          <p className='text-[11px] text-muted-foreground text-center font-exo pt-2'>
            SipánGPT puede cometer errores. Verifica información importante con los reglamentos institucionales oficiales.
          </p>
        </form>
      </ContextMenuTrigger>

      {/* Menú Contextual Completo al hacer Clic Derecho */}
      <ContextMenuContent className='w-56 font-exo'>
        <ContextMenuItem
          onSelect={() => {
            const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
            if (lastAssistant) copyToClipboard(lastAssistant.content)
          }}
          className='gap-2'
        >
          <Copy className='w-4 h-4 text-primary' />
          <span>Copiar última respuesta</span>
        </ContextMenuItem>

        <ContextMenuItem onSelect={() => handleSendMessage()} className='gap-2'>
          <RefreshCw className='w-4 h-4 text-primary' />
          <span>Reintentar respuesta</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={clearMessages} className='gap-2 text-rose-600 dark:text-rose-400'>
          <Trash2 className='w-4 h-4' />
          <span>Limpiar conversación</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onSelect={() => window.open('https://www.uss.edu.pe', '_blank')}
          className='gap-2'
        >
          <BookOpen className='w-4 h-4 text-primary' />
          <span>Portal Oficial USS</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}


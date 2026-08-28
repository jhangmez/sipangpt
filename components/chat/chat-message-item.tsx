'use client'

import {
  Bot,
  BrainCircuit,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  Info,
  RefreshCw,
  Star,
  ThumbsDown,
  ThumbsUp,
  BookOpen
} from 'lucide-react'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter
} from '@/components/ui/message'
import { MessageScrollerItem } from '@/components/ui/message-scroller'
import { Bubble, BubbleContent, BubbleReactions } from '@/components/ui/bubble'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle
} from '@/components/ui/attachment'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { formatTimeAgo } from '@/lib/timeago'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/ui/markdown'
import type { ChatMessage, MessageSource } from '@/types/chat'
import type { ModelDefinition } from '@/constants/models'

interface ChatMessageItemProps {
  message: ChatMessage
  userDisplayName: string
  userImage?: string
  selectedModel: ModelDefinition
  onCopy: (content: string) => void
  onRegenerate: (messageId: string) => void
  onOpenFeedback: (
    message: ChatMessage,
    type: 'Adecuada' | 'Inadecuada' | null,
    rating?: number
  ) => void
  onShowSources?: (sources: MessageSource[]) => void
  onSwitchVersion?: (messageId: string, versionIndex: number) => void
}

export function ChatMessageItem({
  message,
  userDisplayName,
  userImage,
  selectedModel,
  onCopy,
  onRegenerate,
  onOpenFeedback,
  onShowSources,
  onSwitchVersion
}: ChatMessageItemProps) {
  const isUser = message.role === 'user'
  const dateObj = new Date(message.createdAt)
  const formattedDate = dateObj.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
  const formattedTime = dateObj.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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

        {/* Contenido del Mensaje: Si es Asistente incluye ContextMenu interactivo */}
        {!isUser ? (
          <ContextMenu>
            <ContextMenuTrigger className='block cursor-default select-text max-w-[88%] sm:max-w-2xl'>
              <MessageContent className='space-y-2 w-full bg-assistant-bg border border-assistant-border rounded-3xl p-4 sm:p-5 shadow-xs select-text'>
                {/* Header del Mensaje: Nombre del Modelo de IA y Tiempo Relativo */}
                <MessageHeader className='flex items-center justify-between pb-1 border-b border-border/30'>
                  <div className='flex items-center gap-2'>
                    <span className='font-frances font-bold text-xs text-foreground'>
                      {message.modelName || selectedModel.name}
                    </span>
                    <Badge
                      variant='secondary'
                      className='text-[9px] font-mono py-0 px-1.5'
                    >
                      {message.modelProvider || selectedModel.provider}
                    </Badge>
                  </div>
                  <span
                    suppressHydrationWarning
                    className='text-[10px] text-muted-foreground font-mono cursor-default'
                    title={`${formattedDate} - ${formattedTime}`}
                  >
                    {formatTimeAgo(message.createdAt)}
                  </span>
                </MessageHeader>

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
                      <Attachment
                        key={att.id}
                        size='sm'
                        className='rounded-2xl border border-border/80'
                      >
                        <AttachmentMedia>
                          <FileText className='h-4 w-4 text-primary' />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>{att.name}</AttachmentTitle>
                          <AttachmentDescription>
                            {att.size} • {att.type}
                          </AttachmentDescription>
                        </AttachmentContent>
                      </Attachment>
                    ))}
                  </AttachmentGroup>
                )}

                {/* Superficie del Mensaje usando Bubble de Shadcn y MarkdownRenderer */}
                <Bubble variant='ghost' className='rounded-2xl'>
                  <BubbleContent className='text-sm leading-relaxed p-0 font-normal select-text'>
                    <MarkdownRenderer content={message.content} />
                  </BubbleContent>

                  {/* Reacciones de Burbuja con Calificación de Estrellas */}
                  {message.rating && (
                    <BubbleReactions
                      role='img'
                      aria-label={`Calificación: ${message.rating} de 5 estrellas`}
                      className='pt-2'
                    >
                      <Badge
                        variant='outline'
                        onClick={() =>
                          onOpenFeedback(message, null, message.rating)
                        }
                        className='border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[10px] font-bold cursor-pointer hover:bg-amber-500/20 transition'
                      >
                        {'⭐'.repeat(message.rating)} ({message.rating}/5)
                      </Badge>
                    </BubbleReactions>
                  )}
                </Bubble>

                {/* Footer del Mensaje del Asistente: Feedback, Copiar, Regenerar y Diálogo de Información */}
                {message.content && (
                  <MessageFooter className='flex items-center justify-between gap-1.5 pt-2 border-t border-border/30 flex-wrap'>
                    <div className='flex items-center gap-1.5 flex-wrap'>
                      {/* Control de Versiones / Ramas de Respuesta (< 1/2 >) */}
                      {message.versions && message.versions.length > 1 && (
                        <div className='flex items-center gap-0.5 rounded-xl bg-muted/60 px-1 py-0.5 border border-border/50 text-[11px] font-mono select-none mr-1 shrink-0'>
                          <Button
                            variant='ghost'
                            size='icon-xs'
                            disabled={(message.currentVersionIndex ?? 0) <= 0}
                            onClick={() =>
                              onSwitchVersion?.(
                                message.id,
                                (message.currentVersionIndex ?? 0) - 1
                              )
                            }
                            className='h-5 w-5 rounded-md p-0 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer'
                            aria-label='Versión anterior'
                            title='Versión anterior'
                          >
                            <ChevronLeft className='h-3.5 w-3.5' />
                          </Button>

                          <span className='px-1 text-[11px] font-semibold text-foreground/80 cursor-default'>
                            {(message.currentVersionIndex ?? 0) + 1} /{' '}
                            {message.versions.length}
                          </span>

                          <Button
                            variant='ghost'
                            size='icon-xs'
                            disabled={
                              (message.currentVersionIndex ?? 0) >=
                              message.versions.length - 1
                            }
                            onClick={() =>
                              onSwitchVersion?.(
                                message.id,
                                (message.currentVersionIndex ?? 0) + 1
                              )
                            }
                            className='h-5 w-5 rounded-md p-0 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer'
                            aria-label='Siguiente versión'
                            title='Siguiente versión'
                          >
                            <ChevronRight className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      )}

                      {/* Botón Respuesta Adecuada */}
                      <Button
                        variant='ghost'
                        size='icon-xs'
                        onClick={() => onOpenFeedback(message, 'Adecuada', 5)}
                        aria-label='Respuesta adecuada'
                        className='h-7 w-7 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0'
                        title='Respuesta adecuada'
                      >
                        <ThumbsUp className='h-3.5 w-3.5' />
                      </Button>

                      {/* Botón Respuesta Inadecuada */}
                      <Button
                        variant='ghost'
                        size='icon-xs'
                        onClick={() => onOpenFeedback(message, 'Inadecuada', 1)}
                        aria-label='Respuesta inadecuada'
                        className='h-7 w-7 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 shrink-0'
                        title='Respuesta inadecuada'
                      >
                        <ThumbsDown className='h-3.5 w-3.5' />
                      </Button>

                      {/* Botón Copiar */}
                      <Button
                        variant='ghost'
                        size='icon-xs'
                        onClick={() => onCopy(message.content)}
                        aria-label='Copiar mensaje'
                        className='h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0'
                        title='Copiar texto'
                      >
                        <Copy className='h-3.5 w-3.5' />
                      </Button>

                      {/* Botón Regenerar Respuesta */}
                      <Button
                        variant='ghost'
                        size='icon-xs'
                        onClick={() => onRegenerate(message.id)}
                        aria-label='Regenerar respuesta'
                        className='h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0'
                        title='Regenerar respuesta'
                      >
                        <RefreshCw className='h-3.5 w-3.5' />
                      </Button>

                      {/* Botón Abrir Citas RAG en Panel Lateral */}
                      {message.sources &&
                        message.sources.length > 0 &&
                        onShowSources && (
                          <Button
                            variant='outline'
                            size='xs'
                            onClick={() => onShowSources(message.sources!)}
                            className='gap-1 text-[10px] font-semibold rounded-xl text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 h-7 cursor-pointer shrink-0 whitespace-nowrap px-2.5'
                            title='Ver fragmentos y reglamentos en el panel lateral derecho'
                          >
                            <BookOpen className='w-3 h-3 shrink-0' />
                            <span>Ver {message.sources.length} Cita(s) RAG</span>
                          </Button>
                        )}
                    </div>


                    {/* Diálogo Modal de Información del Mensaje */}
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button
                            variant='ghost'
                            size='icon-xs'
                            aria-label='Ver información del mensaje'
                            className='h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer'
                            title='Metadatos e información'
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
                            Metadatos registrados en el motor de inferencia y la
                            base de datos de SipánGPT.
                          </DialogDescription>
                        </DialogHeader>

                        <div className='space-y-3 pt-3 text-xs'>
                          <div className='rounded-2xl border border-border/70 p-3.5 space-y-2 bg-card/60'>
                            {message.isRegeneration && (
                              <div className='flex justify-between items-center pb-2 border-b border-border/40'>
                                <span className='text-muted-foreground'>
                                  Tipo de Generación:
                                </span>
                                <Badge
                                  variant='secondary'
                                  className='text-[10px] bg-primary/10 text-primary border-primary/20 gap-1'
                                >
                                  <RefreshCw className='w-3 h-3' /> Respuesta
                                  Regenerada
                                </Badge>
                              </div>
                            )}
                            <div className='flex justify-between items-center'>
                              <span className='text-muted-foreground'>
                                Modelo de Generación:
                              </span>
                              <span className='font-bold text-foreground'>
                                {message.modelName || selectedModel.name}
                              </span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-muted-foreground'>
                                Modelo de Embeddings:
                              </span>
                              <span className='font-mono font-medium text-foreground'>
                                {message.embeddingModel || 'gemini-embedding-2'}
                              </span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-muted-foreground'>
                                Proveedor:
                              </span>
                              <Badge variant='outline'>
                                {message.modelProvider ||
                                  selectedModel.provider}
                              </Badge>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-muted-foreground'>
                                Tiempo total de respuesta:
                              </span>
                              <span className='font-mono font-medium'>
                                {message.latencyMs
                                  ? `${message.latencyMs} ms`
                                  : '180 ms'}
                              </span>
                            </div>
                            {(message.retrievalLatencyMs !== undefined ||
                              message.generationLatencyMs !== undefined) && (
                              <div className='flex justify-between items-center text-[11px] text-muted-foreground border-t border-border/40 pt-1.5'>
                                <span>
                                  Búsqueda Vectorial:{' '}
                                  <strong className='text-foreground'>
                                    {message.retrievalLatencyMs ?? 0} ms
                                  </strong>
                                </span>
                                <span>
                                  Generación LLM:{' '}
                                  <strong className='text-foreground'>
                                    {message.generationLatencyMs ?? 0} ms
                                  </strong>
                                </span>
                              </div>
                            )}
                            <div className='flex justify-between items-center'>
                              <span className='text-muted-foreground'>
                                Emitido:
                              </span>
                              <span
                                suppressHydrationWarning
                                className='font-mono font-medium'
                              >
                                {formatTimeAgo(message.createdAt)} (
                                {formattedDate} {formattedTime})
                              </span>
                            </div>
                          </div>

                          {/* Fuentes y Citas RAG de la USS */}
                          {message.sources && message.sources.length > 0 && (
                            <div className='space-y-2'>
                              <span className='font-bold text-xs text-foreground block'>
                                Fuentes y Normativas Consultadas:
                              </span>
                              {message.sources.map((src, i) => (
                                <div
                                  key={i}
                                  className='rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-1.5'
                                >
                                  <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-1.5'>
                                      <span className='font-semibold text-primary'>
                                        {src.title}
                                      </span>
                                      {src.relevance !== undefined && (
                                        <Badge
                                          variant='secondary'
                                          className='text-[10px] py-0 px-1 font-mono'
                                        >
                                          Similitud:{' '}
                                          {Math.round(src.relevance * 100)}%
                                        </Badge>
                                      )}
                                    </div>
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
                                    <p className='text-[11px] text-muted-foreground leading-relaxed'>
                                      {src.snippet}
                                    </p>
                                  )}
                                  {src.chunkId && (
                                    <span className='text-[9px] text-muted-foreground font-mono block'>
                                      ID Fragmento: {src.chunkId}
                                    </span>
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
            </ContextMenuTrigger>

            <ContextMenuContent className='w-56 font-exo'>
              <ContextMenuItem
                onSelect={() => onCopy(message.content)}
                className='gap-2'
              >
                <Copy className='w-4 h-4 text-primary' />
                <span>Copiar respuesta</span>
              </ContextMenuItem>

              <ContextMenuItem
                onSelect={() =>
                  onOpenFeedback(message, 'Adecuada', message.rating || 5)
                }
                className='gap-2 text-amber-600 dark:text-amber-400'
              >
                <Star className='w-4 h-4 text-amber-500 fill-amber-500' />
                <span>Puntuar respuesta</span>
              </ContextMenuItem>

              <ContextMenuItem
                onSelect={() => onRegenerate(message.id)}
                className='gap-2'
              >
                <RefreshCw className='w-4 h-4 text-primary' />
                <span>Regenerar respuesta</span>
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
        ) : (
          <MessageContent className='space-y-2 max-w-[88%] sm:max-w-2xl'>
            <Bubble variant='default' className='rounded-2xl'>
              <BubbleContent className='text-sm leading-relaxed whitespace-pre-wrap p-3.5 font-normal'>
                {message.content}
              </BubbleContent>
            </Bubble>
          </MessageContent>
        )}
      </Message>
    </MessageScrollerItem>
  )
}

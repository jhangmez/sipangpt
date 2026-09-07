'use client'

import * as React from 'react'
import {
  Search,
  MessageSquare,
  User as UserIcon,
  Clock,
  Lock,
  ArrowUp,
  Paperclip,
  BookOpen,
  Eye,
  FileText,
  ExternalLink,
  X,
  Sparkles,
  Layers
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChatMessageItem } from '@/components/chat/chat-message-item'
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerButton
} from '@/components/ui/message-scroller'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea
} from '@/components/ui/input-group'
import { toast } from 'sonner'
import {
  getAdminConversationAction,
  getRecentAdminConversationsAction,
} from '@/lib/actions/admin-conversations'
import type { ChatMessage, MessageSource } from '@/types/chat'
import { SYSTEM_MODELS } from '@/constants/models'

interface RecentConversationItem {
  id: string
  title: string
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  user: {
    name: string | null
    email: string | null
    image: string | null
  } | null
  _count: {
    messages: number
  }
  minRating?: number | null
  feedbacksCount?: number
  latestFeedbackReasons?: string[]
}

interface ConversationsInspectorProps {
  initialRecentConversations: RecentConversationItem[]
}

const defaultModel = SYSTEM_MODELS[0]

export function ConversationsInspector({
  initialRecentConversations
}: ConversationsInspectorProps) {
  const [searchId, setSearchId] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [selectedConversation, setSelectedConversation] = React.useState<any | null>(null)
  const [recentConversations, setRecentConversations] =
    React.useState<RecentConversationItem[]>(initialRecentConversations)
  const [feedbackFilter, setFeedbackFilter] = React.useState<
    'all' | 'low_rating' | 'with_feedback'
  >('all')
  const [listLoading, setListLoading] = React.useState(false)
  
  // Estado para el panel lateral de fuentes RAG
  const [sidePanelOpen, setSidePanelOpen] = React.useState(false)
  const [activeSources, setActiveSources] = React.useState<MessageSource[]>([])

  // Cambiar filtro de calibración por feedback
  const handleFilterChange = async (
    newFilter: 'all' | 'low_rating' | 'with_feedback'
  ) => {
    setFeedbackFilter(newFilter)
    setListLoading(true)
    try {
      const res = await getRecentAdminConversationsAction(newFilter)
      setRecentConversations(res as RecentConversationItem[])
    } catch {
      toast.error('Error al filtrar conversaciones.')
    } finally {
      setListLoading(false)
    }
  }

  // Buscar conversación por ID
  const handleSearch = async (idToSearch?: string) => {
    const targetId = idToSearch || searchId.trim()
    if (!targetId) {
      toast.error('Ingresa un ID de conversación válido para buscar.')
      return
    }

    setLoading(true)
    try {
      const conv = await getAdminConversationAction(targetId)
      setSelectedConversation(conv)
      setSearchId(targetId)
      toast.success('Conversación cargada correctamente.')

      // Extraer todas las citas RAG de la conversación para precargar
      const allSources: MessageSource[] = []
      conv.messages.forEach((m: any) => {
        if (m.citations && m.citations.length > 0) {
          m.citations.forEach((c: any) => {
            allSources.push({
              chunkId: c.chunkId,
              documentId: c.documentId,
              title: c.title,
              url: c.url,
              snippet: c.snippet,
              relevance: c.relevance,
              embeddingModel: c.embeddingModel
            })
          })
        }
      })
      setActiveSources(allSources)
      if (allSources.length > 0) {
        setSidePanelOpen(true)
      }
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Error al buscar conversación.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Abrir citas RAG de un mensaje específico
  const handleShowSources = (sources: MessageSource[]) => {
    setActiveSources(sources)
    setSidePanelOpen(true)
  }

  // Convertir mensajes de la BD a formato ChatMessage para UI
  const chatMessages: ChatMessage[] = React.useMemo(() => {
    if (!selectedConversation?.messages) return []
    return selectedConversation.messages.map((m: any) => {
      const sources: MessageSource[] = (m.citations || []).map((c: any) => ({
        chunkId: c.chunkId,
        documentId: c.documentId,
        title: c.title,
        url: c.url,
        snippet: c.snippet,
        relevance: c.relevance,
        embeddingModel: c.embeddingModel
      }))

      return {
        id: m.id,
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
        createdAt: new Date(m.createdAt).toISOString(),
        parentId: m.parentId,
        isRegeneration: m.isRegeneration,
        modelName: m.modelCode || defaultModel.name,
        sources: sources.length > 0 ? sources : undefined
      }
    })
  }, [selectedConversation])

  return (
    <div className='flex flex-col flex-1 h-full min-h-[calc(100vh-9rem)] w-full gap-3 font-exo overflow-hidden p-1 sm:p-2'>

      {/* 1. Barra Superior de Búsqueda por ID */}
      <div className='bg-card border border-border/60 rounded-3xl p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 shrink-0'>
        <div className='flex items-center gap-3 w-full md:w-auto'>
          <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0'>
            <MessageSquare className='h-5 w-5' />
          </div>
          <div>
            <h3 className='font-frances font-bold text-base text-foreground'>
              Inspección de Conversaciones
            </h3>
            <p className='text-xs text-muted-foreground'>
              Audita chats de usuarios por ID e inspecciona las fuentes RAG recuperadas.
            </p>
          </div>
        </div>

        {/* Input de Búsqueda por ID */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
          className='flex items-center gap-2 w-full md:w-96'
        >
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder='Pegar o escribir ID de conversación (ej: cmt...)'
              className='pl-9 h-10 rounded-2xl text-xs font-mono bg-muted/40 border-border/60 focus-visible:ring-primary'
            />
          </div>
          <Button
            type='submit'
            disabled={loading || !searchId.trim()}
            className='h-10 rounded-2xl px-4 text-xs font-semibold shrink-0 cursor-pointer'
          >
            {loading ? 'Buscando...' : 'Buscar ID'}
          </Button>
        </form>
      </div>

      {/* 2. Layout Principal: Conversaciones Recientes (Izq) + Visualizador de Chat (Centro) + Panel de Fuentes RAG (Der) */}
      <div className='flex-1 min-h-0 flex gap-3 overflow-hidden'>
        {/* Panel Izquierdo: Conversaciones Recientes & Calibración Feedback */}
        <div className='w-full lg:w-72 xl:w-80 bg-card border border-border/60 rounded-3xl p-3 flex flex-col shrink-0 overflow-hidden shadow-xs'>
          <div className='pb-2.5 border-b border-border/40 space-y-2 px-1'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold font-frances text-foreground flex items-center gap-1.5'>
                <Clock className='size-3.5 text-primary' /> Recientes & Feedback
              </span>
              <Badge variant='outline' className='text-[10px] font-mono'>
                {recentConversations.length}
              </Badge>
            </div>

            {/* Pestañas de Filtro de Calibración RAG (Estrategia 5) */}
            <div className='grid grid-cols-3 gap-1 bg-muted/50 p-1 rounded-2xl text-[10px]'>
              <button
                type='button'
                onClick={() => handleFilterChange('all')}
                className={`py-1 px-1.5 rounded-xl font-medium transition-all text-center cursor-pointer ${
                  feedbackFilter === 'all'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todas
              </button>
              <button
                type='button'
                onClick={() => handleFilterChange('low_rating')}
                className={`py-1 px-1.5 rounded-xl font-medium transition-all text-center cursor-pointer ${
                  feedbackFilter === 'low_rating'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ⭐ 1-2 (Bajas)
              </button>
              <button
                type='button'
                onClick={() => handleFilterChange('with_feedback')}
                className={`py-1 px-1.5 rounded-xl font-medium transition-all text-center cursor-pointer ${
                  feedbackFilter === 'with_feedback'
                    ? 'bg-primary/15 text-primary shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Feedback
              </button>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto space-y-1.5 pt-2 pr-1'>
            {listLoading ? (
              <div className='p-6 text-center text-xs text-muted-foreground animate-pulse'>
                Filtrando conversaciones...
              </div>
            ) : recentConversations.length === 0 ? (
              <div className='p-6 text-center text-xs text-muted-foreground'>
                {feedbackFilter === 'low_rating'
                  ? 'No hay conversaciones con baja calificación (⭐ 1-2).'
                  : feedbackFilter === 'with_feedback'
                  ? 'No hay conversaciones con feedback registrado.'
                  : 'No hay conversaciones registradas aún.'}
              </div>
            ) : (
              recentConversations.map((item) => {
                const isSelected = selectedConversation?.id === item.id
                const isLowRating =
                  item.minRating !== null &&
                  item.minRating !== undefined &&
                  item.minRating <= 2

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSearch(item.id)}
                    className={`w-full text-left p-2.5 rounded-2xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 shadow-xs'
                        : isLowRating
                        ? 'bg-rose-500/5 border-rose-500/30 hover:bg-rose-500/10'
                        : 'bg-muted/30 border-border/40 hover:bg-muted/60'
                    }`}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='text-xs font-semibold text-foreground truncate flex-1'>
                        {item.title || 'Nueva Consulta'}
                      </span>
                      {item.minRating !== null && item.minRating !== undefined && (
                        <Badge
                          variant='outline'
                          className={`text-[9px] py-0 px-1 font-bold ${
                            item.minRating <= 2
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                          }`}
                        >
                          ⭐ {item.minRating}
                        </Badge>
                      )}
                      {item.isArchived && (
                        <Badge variant='secondary' className='text-[9px] py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'>
                          Oculta
                        </Badge>
                      )}
                    </div>

                    {/* Etiquetas de motivos de insatisfacción para calibración */}
                    {item.latestFeedbackReasons && item.latestFeedbackReasons.length > 0 && (
                      <div className='flex items-center gap-1 flex-wrap'>
                        {item.latestFeedbackReasons.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className='text-[8px] font-mono px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground border border-border/40'
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className='flex items-center justify-between text-[10px] text-muted-foreground font-mono'>
                      <div className='flex items-center gap-1 truncate max-w-[170px]'>
                        <UserIcon className='size-3 shrink-0' />
                        <span className='truncate'>
                          {item.user?.email || item.user?.name || 'Usuario Anónimo'}
                        </span>
                      </div>
                      <span>{item._count.messages} msgs</span>
                    </div>

                    <div className='text-[9px] font-mono text-muted-foreground/70 truncate'>
                      ID: {item.id}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Panel Central: Visualizador de Chat en Modo Inspector */}
        <div className='flex-1 bg-card border border-border/60 rounded-3xl flex flex-col overflow-hidden shadow-xs relative'>
          {selectedConversation ? (
            <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
              {/* Header de la Conversación Seleccionada */}
              <div className='p-3 border-b border-border/40 bg-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0'>
                <div className='flex items-center gap-3'>
                  <Avatar className='h-9 w-9 border border-border/60'>
                    <AvatarImage src={selectedConversation.user?.image || undefined} />
                    <AvatarFallback className='text-xs font-bold bg-primary/10 text-primary'>
                      {selectedConversation.user?.name?.slice(0, 2).toUpperCase() || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className='text-sm font-bold font-frances text-foreground leading-tight'>
                      {selectedConversation.title}
                    </h4>
                    <p className='text-xs text-muted-foreground font-mono'>
                      Propietario: {selectedConversation.user?.name || 'Desconocido'} ({selectedConversation.user?.email || 'sin email'})
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='text-[10px] font-mono py-1'>
                    ID: {selectedConversation.id}
                  </Badge>
                  {activeSources.length > 0 && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setSidePanelOpen(!sidePanelOpen)}
                      className={`h-8 rounded-xl text-xs gap-1.5 transition-all cursor-pointer ${
                        sidePanelOpen
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary font-semibold shadow-xs'
                          : 'border-primary/40 text-primary hover:bg-primary/10 font-medium'
                      }`}
                    >
                      <BookOpen className='size-3.5' />
                      {sidePanelOpen ? 'Ocultar Citas' : `Ver (${activeSources.length}) Citas RAG`}
                    </Button>
                  )}

                </div>
              </div>

              {/* Alerta de Calibración RAG si la conversación tiene feedback con 1 o 2 estrellas (Estrategia 5) */}
              {selectedConversation.messages?.some(
                (m: any) => m.feedbacks?.some((f: any) => f.rating <= 2)
              ) && (
                <div className='p-3 bg-rose-500/10 border-b border-rose-500/30 text-xs flex items-start gap-2.5 shrink-0'>
                  <div className='text-rose-600 dark:text-rose-400 font-bold shrink-0 mt-0.5'>
                    ⚠️ Calibración RAG:
                  </div>
                  <div className='space-y-1 text-muted-foreground leading-relaxed'>
                    <p>
                      Esta consulta recibió calificación insatisfactoria (⭐ 1-2). Revisa las citas RAG y su score:
                    </p>
                    <ul className='list-disc list-inside text-[11px] space-y-0.5 text-foreground/80'>
                      <li>Si recuperó citas erróneas: afina los metadatos o el tamaño del chunk (*chunk size*).</li>
                      <li>Si no hubo citas o la similitud fue baja (&lt; 0.50): existe un <strong>gap de conocimiento</strong>. Sube el reglamento oficial del trámite.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Lista de Mensajes del Chat con MessageScroller */}
              <MessageScrollerProvider>
                <MessageScroller className='flex-1 overflow-hidden'>
                  <MessageScrollerViewport className='p-4'>
                    <MessageScrollerContent>
                      {chatMessages.length === 0 ? (
                        <div className='p-8 text-center text-xs text-muted-foreground'>
                          Esta conversación no contiene mensajes registrados.
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <ChatMessageItem
                            key={msg.id}
                            message={msg}
                            userDisplayName={selectedConversation.user?.name || 'Usuario'}
                            userImage={selectedConversation.user?.image || undefined}
                            selectedModel={defaultModel}
                            onCopy={(txt) => {
                              navigator.clipboard.writeText(txt)
                              toast.success('Texto copiado al portapapeles.')
                            }}
                            onRegenerate={() => {}}
                            onOpenFeedback={() => {}}
                            onShowSources={handleShowSources}
                          />
                        ))
                      )}
                    </MessageScrollerContent>
                  </MessageScrollerViewport>
                  <MessageScrollerButton />
                </MessageScroller>
              </MessageScrollerProvider>

              {/* Formulario de Entrada Deshabilitado (Modo Lectura Administrador) */}
              <div className='p-3 border-t border-border/40 bg-background/90 font-exo space-y-2 shrink-0'>
                <div className='flex items-center justify-between gap-2 px-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 p-2 rounded-2xl'>
                  <span className='flex items-center gap-1.5 font-semibold text-[11px] sm:text-xs'>
                    <Lock className='size-3.5 shrink-0' />
                    Modo Inspección Administrador (Solo Lectura)
                  </span>
                  <span className='text-[10px] text-muted-foreground hidden sm:inline'>
                    No se pueden enviar mensajes en conversaciones de usuarios.
                  </span>
                </div>

                <InputGroup className='h-auto min-h-[46px] rounded-3xl border border-border/60 bg-muted/40 p-1.5 opacity-60 cursor-not-allowed items-end'>
                  <InputGroupAddon align='inline-start' className='self-end pb-1 pl-1'>
                    <InputGroupButton
                      size='icon-sm'
                      variant='ghost'
                      disabled
                      className='h-8 w-8 rounded-2xl text-muted-foreground'
                    >
                      <Paperclip className='h-4 w-4' />
                    </InputGroupButton>
                  </InputGroupAddon>

                  <InputGroupTextarea
                    value=''
                    disabled
                    placeholder='Modo inspección de administrador deshabilitado...'
                    rows={1}
                    className='field-sizing-content min-h-[36px] max-h-40 resize-none overflow-y-auto px-2 py-1.5 text-xs sm:text-sm font-exo text-muted-foreground border-0 shadow-none ring-0 leading-relaxed cursor-not-allowed'
                  />

                  <InputGroupAddon align='inline-end' className='self-end pb-1 pr-1'>
                    <InputGroupButton
                      size='icon-sm'
                      variant='default'
                      disabled
                      className='h-8 w-8 rounded-2xl bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                    >
                      <ArrowUp className='h-4 w-4' />
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </div>
          ) : (
            /* Estado Vacío: Sin Conversación Seleccionada */
            <div className='flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 font-exo text-muted-foreground'>
              <div className='h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-1'>
                <Eye className='size-8' />
              </div>
              <h4 className='font-frances font-bold text-lg text-foreground'>
                Selecciona o Busca una Conversación
              </h4>
              <p className='text-xs max-w-sm leading-relaxed'>
                Ingresa un ID de conversación en la barra superior o elige una de la lista de conversaciones recientes en la izquierda para auditar el historial y las citas RAG.
              </p>
            </div>
          )}
        </div>

        {/* Panel Derecho Integrado: Fuentes y Citas RAG Recuperadas */}
        {sidePanelOpen && (
          <aside className='w-80 xl:w-96 bg-card border border-border/60 rounded-3xl flex flex-col shrink-0 overflow-hidden shadow-xs animate-in slide-in-from-right-4 duration-300'>
            {/* Header del Panel de Fuentes RAG */}
            <div className='p-3.5 border-b border-border/40 bg-muted/20 flex items-center justify-between shrink-0'>
              <div className='flex items-center gap-2'>
                <div className='flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                  <BookOpen className='size-4' />
                </div>
                <div>
                  <h4 className='font-frances font-bold text-sm text-foreground leading-tight'>
                    Fuentes RAG recuperadas
                  </h4>
                  <p className='text-[10px] text-muted-foreground font-mono'>
                    {activeSources.length} fragmento(s) indexado(s)
                  </p>
                </div>
              </div>

              <Button
                variant='ghost'
                size='icon-xs'
                onClick={() => setSidePanelOpen(false)}
                className='h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer'
                title='Cerrar panel de fuentes'
              >
                <X className='size-4' />
              </Button>
            </div>

            {/* Lista de Tarjetas de Citas RAG Estilizadas */}
            <div className='flex-1 overflow-y-auto p-3 space-y-3'>
              {activeSources.length === 0 ? (
                <div className='p-6 text-center text-xs text-muted-foreground space-y-2'>
                  <Layers className='size-8 mx-auto text-muted-foreground/50' />
                  <p>No hay fuentes RAG citadas para este turno o conversación.</p>
                  <p className='text-[10px] text-muted-foreground/70'>
                    Haz clic en &quot;Ver Citas RAG&quot; dentro de cualquier mensaje de respuesta del asistente.
                  </p>
                </div>
              ) : (
                activeSources.map((source, index) => {
                  const relevancePct = Math.round((source.relevance || 0) * 100)
                  return (
                    <div
                      key={`${source.chunkId || 'chunk'}-${index}`}
                      className='rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2 text-xs hover:border-primary/40 transition shadow-xs'
                    >

                      {/* Cabecera del Documento: Relevancia y Título */}
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex items-center gap-1.5 min-w-0 flex-1'>
                          <FileText className='size-4 text-primary shrink-0' />
                          <span className='font-semibold text-foreground truncate text-xs'>
                            {source.title || 'Documento USS sin título'}
                          </span>
                        </div>
                        {relevancePct > 0 && (
                          <Badge
                            variant='outline'
                            className='text-[9px] font-mono px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shrink-0'
                          >
                            {relevancePct}% relevancia
                          </Badge>
                        )}
                      </div>

                      {/* Snippet o Texto del Fragmento Indexado */}
                      {source.snippet && (
                        <div className='p-2.5 rounded-xl bg-background/80 border border-border/40 text-[11px] text-muted-foreground font-exo leading-relaxed max-h-40 overflow-y-auto select-text'>
                          {source.snippet}
                        </div>
                      )}

                      {/* Modelo de Embedding y Botón de Archivo Oficial */}
                      <div className='flex items-center justify-between pt-1 text-[10px] text-muted-foreground font-mono border-t border-border/30'>
                        <span className='truncate'>
                          Model: {source.embeddingModel || 'text-embedding-004'}
                        </span>

                        {source.url && (
                          <a
                            href={source.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-1 text-primary font-semibold hover:underline shrink-0'
                          >
                            <span>Ver PDF</span>
                            <ExternalLink className='size-3' />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

'use client'

import * as React from 'react'
import {
  Newspaper,
  BookOpen,
  FileText,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Calendar,
  PanelRightClose,
  PanelRightOpen,
  ArrowLeft,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PostItem } from '@/types'
import type { MessageSource } from '@/types/chat'

interface ChatSidePanelProps {
  posts?: PostItem[]
  activeSources?: MessageSource[]
  activeTab?: 'posts' | 'sources'
  onTabChange?: (tab: 'posts' | 'sources') => void
  isOpen?: boolean
  onToggleOpen?: () => void
}

export function ChatSidePanel({
  posts = [],
  activeSources = [],
  activeTab = 'posts',
  onTabChange,
  isOpen = true,
  onToggleOpen,
}: ChatSidePanelProps) {
  const isShowingSources = activeTab === 'sources' && activeSources.length > 0

  const handleBackToPosts = () => {
    if (onTabChange) {
      onTabChange('posts')
    }
  }

  if (!isOpen) {
    return (
      <aside className='hidden lg:flex flex-col items-center py-4 px-1 border-l border-border/60 bg-card/40 w-12 shrink-0 transition-all font-exo'>
        <Button
          variant='ghost'
          size='icon-xs'
          onClick={onToggleOpen}
          className='rounded-xl text-muted-foreground hover:text-foreground cursor-pointer'
          title='Abrir panel lateral de Novedades y Fuentes'
        >
          <PanelRightOpen className='w-4 h-4' />
        </Button>
      </aside>
    )
  }

  return (
    <aside className='hidden lg:flex flex-col w-80 xl:w-96 shrink-0 border-l border-border/60 bg-card/50 overflow-hidden font-exo transition-all'>
      {/* Cabecera del Panel */}
      <div className='p-3.5 border-b border-border/40 space-y-2 bg-card'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {isShowingSources ? (
              <BookOpen className='w-4 h-4 text-primary' />
            ) : (
              <Newspaper className='w-4 h-4 text-primary' />
            )}
            <span className='font-frances font-bold text-sm text-foreground'>
              {isShowingSources
                ? 'Fuentes Oficiales Citadas'
                : 'Novedades y Publicaciones'}
            </span>
          </div>

          <div className='flex items-center gap-1'>
            {isShowingSources && (
              <Button
                variant='ghost'
                size='xs'
                onClick={handleBackToPosts}
                className='text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer h-7'
              >
                <ArrowLeft className='w-3 h-3' /> Novedades
              </Button>
            )}
            {onToggleOpen && (
              <Button
                variant='ghost'
                size='icon-xs'
                onClick={onToggleOpen}
                className='rounded-lg text-muted-foreground hover:text-foreground cursor-pointer'
                title='Minimizar panel lateral'
              >
                <PanelRightClose className='w-4 h-4' />
              </Button>
            )}
          </div>
        </div>
        <p className='text-[11px] text-muted-foreground leading-tight'>
          {isShowingSources
            ? 'Reglamentos y fragmentos normativos RAG que fundamentan la respuesta actual.'
            : 'Avisos, directivas y comunicados institucionales de la Universidad Señor de Sipán.'}
        </p>
      </div>

      {/* Contenido Desplazable del Panel */}
      <div className='flex-1 overflow-y-auto p-3.5 space-y-3'>
        {isShowingSources ? (
          /* MODO FUENTES OFICIALES CITADAS (RAG) */
          <div className='space-y-3'>
            <div className='p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs space-y-1'>
              <p className='font-bold text-primary flex items-center gap-1.5 text-[11px]'>
                <FileText className='w-3.5 h-3.5' /> Citas Normativas RAG (
                {activeSources.length})
              </p>
              <p className='text-[10px] text-muted-foreground leading-snug'>
                Información oficial verificada en la base documental de la USS:
              </p>
            </div>

            {activeSources.map((source, sIdx) => {
              const relevancePercent =
                source.relevance !== undefined
                  ? Math.round(source.relevance * 100)
                  : null

              const targetDocUrl = source.url || '#'

              return (
                <div
                  key={sIdx}
                  className='rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs space-y-2.5 text-xs hover:border-primary/40 transition-colors'
                >
                  {/* Encabezado de la Fuente */}
                  <div className='space-y-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-bold text-foreground text-xs line-clamp-2 leading-snug'>
                        {source.title}
                      </span>
                      {relevancePercent !== null && (
                        <Badge
                          variant='secondary'
                          className='text-[9px] py-0 px-1.5 font-mono shrink-0 bg-primary/15 text-primary border-primary/20'
                        >
                          {relevancePercent}% relevancia
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Texto Recuperado del Fragmento */}
                  {source.snippet && (
                    <div className='rounded-xl bg-muted/40 p-2.5 border border-border/50 text-[11px] text-muted-foreground font-mono leading-relaxed space-y-1'>
                      <div className='flex items-center gap-1 text-[10px] text-primary/80 font-sans font-semibold'>
                        <Sparkles className='w-3 h-3' /> Fragmento recuperado:
                      </div>
                      <p className='italic'>«{source.snippet}»</p>
                    </div>
                  )}

                  {/* Botón de enlace para ver el documento en otra ventana */}
                  {source.url ? (
                    <a
                      href={targetDocUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold transition-all border border-primary/25 cursor-pointer shadow-xs'
                    >
                      <ExternalLink className='w-3.5 h-3.5' />
                      Ver Documento Oficial (PDF / Portal)
                    </a>
                  ) : (
                    <div className='text-[10px] text-muted-foreground text-center py-1 bg-muted/20 rounded-lg'>
                      Documento interno USS
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : /* MODO LISTA DE PUBLICACIONES / POSTS CON REDIRECCIÓN */
        posts.length === 0 ? (
          <div className='py-12 text-center text-xs text-muted-foreground space-y-2'>
            <Newspaper className='w-7 h-7 mx-auto text-muted-foreground/50' />
            <p className='font-semibold text-foreground'>
              Sin publicaciones recientes
            </p>
            <p className='text-[11px] leading-relaxed'>
              Los comunicados académicos oficiales aparecerán en este panel.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {posts.map((post) => {
              const targetHref = post.externalUrl || `/posts/${post.slug}`

              return (
                <a
                  key={post.id}
                  href={targetHref}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='group block rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer space-y-2'
                >
                  <div className='flex items-center justify-between gap-2 flex-wrap'>
                    {post.category ? (
                      <Badge
                        variant='outline'
                        className='text-[9px] uppercase font-bold text-primary border-primary/30 bg-primary/10 py-0'
                      >
                        {post.category.name}
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='text-[9px] py-0'>
                        Oficial
                      </Badge>
                    )}
                    <span className='text-[10px] text-muted-foreground flex items-center gap-1'>
                      <Calendar className='w-3 h-3' />
                      {new Date(
                        post.publishedAt || post.createdAt
                      ).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <h4 className='font-frances text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug'>
                    {post.title}
                  </h4>

                  {post.excerpt && (
                    <p className='text-[11px] text-muted-foreground line-clamp-2 leading-relaxed'>
                      {post.excerpt}
                    </p>
                  )}

                  <div className='flex items-center justify-between pt-1 text-[10px] text-primary font-semibold'>
                    <span>
                      {post.externalUrl
                        ? 'Abrir enlace oficial'
                        : 'Leer comunicado completo'}
                    </span>
                    <ChevronRight className='w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform' />
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

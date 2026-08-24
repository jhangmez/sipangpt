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
  User,
  PanelRightClose,
  PanelRightOpen,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
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
  const [selectedPost, setSelectedPost] = React.useState<PostItem | null>(null)
  const currentTab = activeTab

  const setTab = (tab: 'posts' | 'sources') => {
    if (onTabChange) {
      onTabChange(tab)
    }
  }

  if (!isOpen) {
    return (
      <aside className='hidden lg:flex flex-col items-center py-4 px-1 border-l border-border/60 bg-card/40 w-12 shrink-0 transition-all font-exo'>
        <Button
          variant='ghost'
          size='icon-xs'
          onClick={onToggleOpen}
          className='rounded-xl text-muted-foreground hover:text-foreground'
          title='Abrir panel lateral de Novedades y Fuentes'
        >
          <PanelRightOpen className='w-4 h-4' />
        </Button>
        <div className='flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground writing-vertical-rl rotate-180 text-[11px] font-semibold tracking-wider pt-6'>
          <span>NOVEDADES & FUENTES</span>
        </div>
      </aside>
    )
  }

  return (
    <>
      <aside className='hidden lg:flex flex-col w-80 xl:w-96 shrink-0 border-l border-border/60 bg-card/50 overflow-hidden font-exo transition-all'>
        {/* Cabecera del Panel con Pestañas y Botón Cerrar */}
        <div className='p-3.5 border-b border-border/40 space-y-3 bg-card'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Sparkles className='w-4 h-4 text-primary' />
              <span className='font-frances font-bold text-sm text-foreground'>
                Panel Institucional
              </span>
            </div>
            {onToggleOpen && (
              <Button
                variant='ghost'
                size='icon-xs'
                onClick={onToggleOpen}
                className='rounded-lg text-muted-foreground hover:text-foreground'
                title='Minimizar panel lateral'
              >
                <PanelRightClose className='w-4 h-4' />
              </Button>
            )}
          </div>

          {/* Selector de Pestañas: Publicaciones vs Fuentes Oficiales */}
          <div className='flex items-center p-1 rounded-xl bg-muted/40 border border-border/60'>
            <button
              type='button'
              onClick={() => setTab('posts')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer',
                currentTab === 'posts'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Newspaper className='w-3.5 h-3.5 text-primary' />
              <span>Novedades ({posts.length})</span>
            </button>

            <button
              type='button'
              onClick={() => setTab('sources')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer',
                currentTab === 'sources'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BookOpen className='w-3.5 h-3.5 text-primary' />
              <span>Fuentes ({activeSources.length})</span>
            </button>
          </div>
        </div>

        {/* Contenido Desplazable del Panel */}
        <div className='flex-1 overflow-y-auto p-3.5 space-y-3'>
          {currentTab === 'posts' ? (
            /* LISTA DE POSTS / PUBLICACIONES USS */
            posts.length === 0 ? (
              <div className='py-12 text-center text-xs text-muted-foreground space-y-2'>
                <Newspaper className='w-7 h-7 mx-auto text-muted-foreground/50' />
                <p className='font-semibold text-foreground'>Sin publicaciones recientes</p>
                <p className='text-[11px] leading-relaxed'>
                  Los comunicados académicos oficiales aparecerán en este panel.
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {posts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className='group rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer space-y-2'
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
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString('es-PE', {
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
                      <span>Leer comunicado completo</span>
                      <ChevronRight className='w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform' />
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : (
            /* LISTA DE FUENTES Y CITAS RAG */
            activeSources.length === 0 ? (
              <div className='py-12 text-center text-xs text-muted-foreground space-y-2'>
                <BookOpen className='w-7 h-7 mx-auto text-muted-foreground/50' />
                <p className='font-semibold text-foreground'>Sin fuentes activas</p>
                <p className='text-[11px] leading-relaxed max-w-xs mx-auto'>
                  Realiza una consulta sobre reglamentos o trámites y las fuentes de citas oficiales se desplegarán aquí en vivo.
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                <div className='p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs space-y-1'>
                  <p className='font-bold text-primary flex items-center gap-1.5 text-[11px]'>
                    <FileText className='w-3.5 h-3.5' /> Fuentes Oficiales Citadas
                  </p>
                  <p className='text-[10px] text-muted-foreground leading-snug'>
                    Fragmentos normativos extraídos mediante el motor vectorial RAG para fundamentar la respuesta:
                  </p>
                </div>

                {activeSources.map((source, sIdx) => (
                  <div
                    key={sIdx}
                    className='rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs space-y-2 text-xs'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-semibold text-foreground line-clamp-1 text-[11px]'>
                        {source.title}
                      </span>
                      {source.url && (
                        <a
                          href={source.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary hover:underline flex items-center gap-1 text-[10px] shrink-0 font-medium'
                        >
                          Ver PDF <ExternalLink className='w-3 h-3' />
                        </a>
                      )}
                    </div>

                    {source.snippet && (
                      <p className='text-[11px] text-muted-foreground font-mono bg-muted/40 p-2 rounded-xl leading-relaxed border border-border/40'>
                        «{source.snippet}»
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </aside>

      {/* DIÁLOGO / MODAL DE LECTURA COMPLETA DE POST */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className='max-w-lg rounded-3xl p-6 font-exo max-h-[85vh] overflow-y-auto'>
          {selectedPost && (
            <div className='space-y-4'>
              <DialogHeader className='space-y-2 text-left'>
                <div className='flex items-center gap-2 flex-wrap'>
                  {selectedPost.category && (
                    <Badge variant='outline' className='text-[10px] uppercase font-bold text-primary border-primary/30 bg-primary/10 py-0'>
                      {selectedPost.category.name}
                    </Badge>
                  )}
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <Calendar className='w-3.5 h-3.5' />
                    {new Date(selectedPost.publishedAt || selectedPost.createdAt).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <DialogTitle className='font-frances text-xl font-bold text-foreground leading-snug'>
                  {selectedPost.title}
                </DialogTitle>
                {selectedPost.author && (
                  <DialogDescription className='text-xs text-muted-foreground flex items-center gap-1.5'>
                    <User className='w-3.5 h-3.5' /> Por {selectedPost.author.name || 'Dirección Académica USS'}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className='prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed space-y-3 whitespace-pre-line text-foreground/90 border-t border-border/40 pt-3'>
                {selectedPost.content}
              </div>

              <div className='flex justify-end pt-3 border-t border-border/40'>
                <Button
                  type='button'
                  size='sm'
                  onClick={() => setSelectedPost(null)}
                  className='rounded-xl text-xs font-semibold'
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

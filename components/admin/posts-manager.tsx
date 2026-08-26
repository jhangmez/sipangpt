'use client'

import * as React from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  createPostAction,
  updatePostAction,
  togglePostStatusAction,
  deletePostAction
} from '@/lib/actions/admin-posts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Newspaper,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  Tags,
  Image as ImageIcon,
  Link2
} from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'
import type { PostItem, PostStatus } from '@/types'
import {
  POST_FILTER_OPTIONS,
  POST_STATUSES,
  POST_STATUS_LABELS,
  DEFAULT_POST_STATUS,
  type PostFilterOption
} from '@/constants'

interface CategoryItem {
  id: string
  name: string
  slug: string
}

interface PostsManagerProps {
  initialPosts: PostItem[]
  categories: CategoryItem[]
}

export function PostsManager({ initialPosts, categories }: PostsManagerProps) {
  const [posts, setPosts] = React.useState<PostItem[]>(initialPosts)
  const [statusFilter, setStatusFilter] = React.useState<PostFilterOption>('ALL')

  // Modal de Crear / Editar
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingPost, setEditingPost] = React.useState<PostItem | null>(null)

  // Campos del formulario
  const [title, setTitle] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [categoryId, setCategoryId] = React.useState<string>('none')
  const [status, setStatus] = React.useState<PostStatus>(DEFAULT_POST_STATUS)
  const [coverImage, setCoverImage] = React.useState('')
  const [externalUrl, setExternalUrl] = React.useState('')
  const [excerpt, setExcerpt] = React.useState('')
  const [content, setContent] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const openCreateDialog = () => {
    setEditingPost(null)
    setTitle('')
    setSlug('')
    setCategoryId('none')
    setStatus('PUBLISHED')
    setCoverImage('')
    setExternalUrl('')
    setExcerpt('')
    setContent('')
    setIsDialogOpen(true)
  }

  const openEditDialog = (post: PostItem) => {
    setEditingPost(post)
    setTitle(post.title)
    setSlug(post.slug)
    setCategoryId(post.category?.id || 'none')
    setStatus(post.status)
    setCoverImage(post.coverImage || '')
    setExternalUrl(post.externalUrl || '')
    setExcerpt(post.excerpt || '')
    setContent(post.content)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('El título y el contenido son obligatorios.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingPost) {
        const res = await updatePostAction(editingPost.id, {
          title,
          slug,
          categoryId,
          status,
          coverImage,
          externalUrl,
          excerpt,
          content
        })
        if (res.success && res.post) {
          setPosts((prev) =>
            prev.map((p) => (p.id === res.post.id ? res.post : p))
          )
          toast.success('Publicación actualizada exitosamente')
          setIsDialogOpen(false)
        }
      } else {
        const res = await createPostAction({
          title,
          slug,
          categoryId,
          status,
          coverImage,
          externalUrl,
          excerpt,
          content
        })
        if (res.success && res.post) {
          setPosts((prev) => [res.post, ...prev])
          toast.success('Publicación creada exitosamente')
          setIsDialogOpen(false)
        }
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al guardar la publicación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (post: PostItem) => {
    try {
      const res = await togglePostStatusAction(post.id, post.status)
      if (res.success && res.post) {
        setPosts((prev) =>
          prev.map((p) => (p.id === res.post.id ? res.post : p))
        )
        toast.success(
          res.post.status === POST_STATUSES.PUBLISHED
            ? 'Publicación activada en vivo'
            : 'Publicación guardada como borrador'
        )
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al cambiar estado')
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm('¿Estás seguro de eliminar permanentemente esta publicación?')
    ) {
      return
    }

    try {
      await deletePostAction(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      toast.success('Publicación eliminada correctamente')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al eliminar publicación')
    }
  }

  const filteredPosts = posts.filter((p) => {
    if (statusFilter === 'ALL') return true
    return p.status === statusFilter
  })

  return (
    <div className='space-y-6 font-exo'>
      {/* Cabecera y Botón de Crear */}
      <div className='rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h2 className='font-frances text-xl font-bold text-foreground flex items-center gap-2'>
            <Newspaper className='w-5 h-5 text-primary' />
            Gestión de Publicaciones y Novedades USS
          </h2>
          <p className='text-xs text-muted-foreground max-w-xl leading-relaxed'>
            Crea comunicados oficiales, directivas académicas o enlaces a
            páginas externas que se mostrarán a los estudiantes en el panel
            lateral del chat.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className='gap-2 rounded-xl text-xs shrink-0 cursor-pointer shadow-xs'
        >
          <Plus className='w-4 h-4' /> Nueva Publicación
        </Button>
      </div>

      {/* Barra de Filtros por Estado */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60'>
          {POST_FILTER_OPTIONS.map((st) => {
            const count =
              st === 'ALL'
                ? posts.length
                : posts.filter((p) => p.status === st).length

            return (
              <button
                key={st}
                type='button'
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {POST_STATUS_LABELS[st]} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista de Publicaciones */}
      {filteredPosts.length === 0 ? (
        <div className='rounded-3xl border border-border/80 bg-card p-12 text-center text-xs text-muted-foreground space-y-2'>
          <Newspaper className='w-8 h-8 mx-auto text-muted-foreground/50' />
          <p className='font-semibold text-foreground text-sm'>
            No se encontraron publicaciones
          </p>
          <p className='text-xs'>
            Crea una nueva publicación para comunicar novedades institucionales.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {filteredPosts.map((post) => {
            const targetHref = post.externalUrl || `/posts/${post.slug}`
            const isExternal = !!post.externalUrl

            return (
              <div
                key={post.id}
                className={`rounded-3xl border p-5 transition-all flex flex-col justify-between gap-4 ${
                  post.status === 'PUBLISHED'
                    ? 'border-border/80 bg-card shadow-xs hover:border-primary/40'
                    : 'border-border/40 bg-muted/20 opacity-80'
                }`}
              >
                <div className='space-y-3'>
                  <div className='flex items-center justify-between gap-2 flex-wrap'>
                    <div className='flex items-center gap-2'>
                      {post.category ? (
                        <Badge
                          variant='outline'
                          className='text-[9px] uppercase font-bold text-primary border-primary/30 bg-primary/10 py-0'
                        >
                          {post.category.name}
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-[9px] py-0'>
                          General
                        </Badge>
                      )}
                      <Badge
                        variant={
                          post.status === 'PUBLISHED'
                            ? 'default'
                            : post.status === 'DRAFT'
                              ? 'secondary'
                              : 'outline'
                        }
                        className='text-[9px] font-mono py-0'
                      >
                        {post.status}
                      </Badge>
                      {isExternal && (
                        <Badge
                          variant='secondary'
                          className='text-[9px] gap-1 py-0'
                        >
                          <Link2 className='w-2.5 h-2.5' /> Enlace Externo
                        </Badge>
                      )}
                    </div>

                    <span className='text-[11px] text-muted-foreground flex items-center gap-1'>
                      <Calendar className='w-3 h-3' />
                      {new Date(
                        post.publishedAt || post.createdAt
                      ).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h3 className='font-frances font-bold text-base text-foreground line-clamp-2 leading-snug'>
                    {post.title}
                  </h3>

                  {post.excerpt && (
                    <p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
                      {post.excerpt}
                    </p>
                  )}
                </div>

                <div className='flex items-center justify-between pt-3 border-t border-border/40 gap-2'>
                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={post.status === 'PUBLISHED'}
                      onCheckedChange={() => handleToggleStatus(post)}
                      aria-label='Publicar o despublicar'
                    />
                    <span className='text-[11px] text-muted-foreground'>
                      {post.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>

                  <div className='flex items-center gap-1'>
                    {post.status === 'PUBLISHED' && (
                      <a
                        href={targetHref}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition cursor-pointer flex items-center gap-1 text-xs'
                        title='Abrir publicación en nueva pestaña'
                      >
                        <ExternalLink className='w-3.5 h-3.5' />
                      </a>
                    )}
                    <Button
                      variant='ghost'
                      size='icon-xs'
                      onClick={() => openEditDialog(post)}
                      className='rounded-xl text-muted-foreground hover:text-foreground'
                      title='Editar publicación'
                    >
                      <Edit2 className='w-3.5 h-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon-xs'
                      onClick={() => handleDelete(post.id)}
                      className='rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10'
                      title='Eliminar publicación'
                    >
                      <Trash2 className='w-3.5 h-3.5' />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL PARA CREAR / EDITAR PUBLICACIÓN */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl rounded-3xl p-6 font-exo max-h-[90vh] overflow-y-auto'>
          <DialogHeader className='space-y-1.5 text-left'>
            <DialogTitle className='font-frances text-xl flex items-center gap-2'>
              <Newspaper className='w-5 h-5 text-primary' />
              {editingPost ? 'Editar Publicación' : 'Crear Nueva Publicación'}
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              Redacta comunicados oficiales, convocatorias o define enlaces de
              redirección a páginas externas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='postTitle' className='text-xs font-semibold'>
                Título de la Publicación
              </Label>
              <Input
                id='postTitle'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Ej. Cronograma Oficial de Matrícula y Pagos 2026-I'
                className='rounded-xl text-xs'
                required
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='postCategory'
                  className='text-xs font-semibold flex items-center gap-1'
                >
                  <Tags className='w-3 h-3 text-primary' /> Categoría
                </Label>
                <select
                  id='postCategory'
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-exo text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
                >
                  <option value='none'>General / Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='postStatus' className='text-xs font-semibold'>
                  Estado
                </Label>
                <select
                  id='postStatus'
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PostStatus)}
                  className='w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-exo text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
                >
                  <option value='PUBLISHED'>Publicado (En vivo)</option>
                  <option value='DRAFT'>Borrador</option>
                  <option value='ARCHIVED'>Archivado</option>
                </select>
              </div>
            </div>

            {/* Enlace Externo de Redirección */}
            <div className='space-y-1.5'>
              <Label
                htmlFor='postExternalUrl'
                className='text-xs font-semibold flex items-center gap-1'
              >
                <Link2 className='w-3 h-3 text-primary' /> Enlace Externo / URL
                de Redirección (Opcional)
              </Label>
              <Input
                id='postExternalUrl'
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder='https://www.uss.edu.pe/noticias/matricula-2026'
                className='rounded-xl text-xs font-mono'
              />
              <p className='text-[11px] text-muted-foreground'>
                Si se define, los estudiantes serán redirigidos a esta web
                externa al hacer clic en el card.
              </p>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='postExcerpt' className='text-xs font-semibold'>
                Extracto Corto / Resumen
              </Label>
              <Input
                id='postExcerpt'
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder='Breve síntesis para el panel del chat y listados...'
                className='rounded-xl text-xs'
              />
            </div>

            <div className='space-y-1.5'>
              <Label
                htmlFor='postImage'
                className='text-xs font-semibold flex items-center gap-1'
              >
                <ImageIcon className='w-3 h-3 text-primary' /> Imagen de Portada
                (Opcional)
              </Label>
              <Input
                id='postImage'
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder='https://...'
                className='rounded-xl text-xs font-mono'
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='postContent' className='text-xs font-semibold'>
                Contenido Completo (Markdown)
              </Label>
              <Textarea
                id='postContent'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='Escribe el cuerpo del comunicado...'
                rows={8}
                className='rounded-xl text-xs font-exo leading-relaxed'
                required
              />
            </div>

            <div className='flex justify-end gap-2 pt-2 border-t border-border/40'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsDialogOpen(false)}
                className='rounded-xl text-xs'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='rounded-xl text-xs font-semibold'
              >
                {isSubmitting
                  ? 'Guardando...'
                  : editingPost
                    ? 'Actualizar Post'
                    : 'Publicar Post'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

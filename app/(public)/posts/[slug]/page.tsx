import * as React from 'react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  Sparkles,
  Building,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PostSlugPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PostSlugPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  })

  if (!post) {
    return { title: 'Publicación no encontrada • SipánGPT' }
  }

  return {
    title: `${post.title} • Novedades USS`,
    description:
      post.excerpt ||
      'Comunicado y noticia oficial de la Universidad Señor de Sipán en SipánGPT.',
  }
}

export default async function PostSlugPage({ params }: PostSlugPageProps) {
  const { slug } = await params

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: { name: true, email: true, image: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  })

  if (!post || post.status !== 'PUBLISHED') {
    notFound()
  }

  const formattedDate = new Date(
    post.publishedAt || post.createdAt
  ).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Estimación de tiempo de lectura (aprox 200 palabras por minuto)
  const wordsCount = post.content.split(/\s+/).length
  const readingTime = Math.max(1, Math.ceil(wordsCount / 200))

  return (
    <main className='min-h-screen bg-background font-exo py-8 px-4 sm:px-6 lg:px-8'>
      <article className='max-w-3xl mx-auto space-y-8'>
        {/* Barra superior de navegación */}
        <div className='flex items-center justify-between border-b border-border/40 pb-4'>
          <Link
            href='/chat'
            className='inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition'
          >
            <ArrowLeft className='w-4 h-4' />
            Volver al Chat Asistente
          </Link>

          <Badge variant='outline' className='text-[10px] gap-1 py-0'>
            <Building className='w-3 h-3 text-primary' />
            Universidad Señor de Sipán
          </Badge>
        </div>

        {/* Encabezado del Post */}
        <header className='space-y-4'>
          <div className='flex items-center gap-2 flex-wrap'>
            {post.category ? (
              <Badge className='text-[11px] font-bold bg-primary/15 text-primary border-primary/30 py-0.5'>
                {post.category.name}
              </Badge>
            ) : (
              <Badge variant='secondary' className='text-[11px] py-0.5'>
                Comunicado Oficial
              </Badge>
            )}
            <span className='text-xs text-muted-foreground flex items-center gap-1'>
              <Clock className='w-3.5 h-3.5' />
              {readingTime} min de lectura
            </span>
          </div>

          <h1 className='font-frances text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight'>
            {post.title}
          </h1>

          {post.excerpt && (
            <p className='text-sm sm:text-base text-muted-foreground leading-relaxed font-normal'>
              {post.excerpt}
            </p>
          )}

          <div className='flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground flex-wrap gap-2'>
            <div className='flex items-center gap-2'>
              <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-frances font-bold'>
                {(post.author.name || 'USS')[0]}
              </div>
              <div>
                <p className='font-semibold text-foreground'>
                  {post.author.name || 'Dirección Académica USS'}
                </p>
                <p className='text-[11px]'>{formattedDate}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Imagen de Portada si existe */}
        {post.coverImage && (
          <div className='rounded-3xl overflow-hidden border border-border/60 shadow-xs'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className='w-full h-auto max-h-[420px] object-cover'
            />
          </div>
        )}

        {/* Cuerpo del Contenido */}
        <section className='prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground/90 leading-relaxed space-y-4 whitespace-pre-line border-t border-border/40 pt-6'>
          {post.content}
        </section>

        {/* Pie del Post con CTA al Asistente */}
        <footer className='rounded-3xl border border-primary/20 bg-primary/5 p-6 space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 mt-12'>
          <div className='space-y-1'>
            <h3 className='font-frances font-bold text-base text-foreground flex items-center justify-center sm:justify-start gap-2'>
              <Sparkles className='w-4 h-4 text-primary' />
              ¿Tienes dudas sobre este comunicado?
            </h3>
            <p className='text-xs text-muted-foreground'>
              Consulta directamente con SipánGPT para resolver inquietudes académicas basadas en reglamentos oficiales.
            </p>
          </div>

          <Link href='/chat'>
            <Button className='rounded-xl text-xs font-semibold shrink-0 shadow-xs'>
              Consultar en SipánGPT
            </Button>
          </Link>
        </footer>
      </article>
    </main>
  )
}

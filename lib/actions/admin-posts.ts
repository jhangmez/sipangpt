'use server'

import { prisma, PostStatus } from '@/lib/prisma'
import { getAuthenticatedUser, requireRole } from '@/lib/session'
import { Role } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { PostItem } from '@/types'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function getAdminPostsData() {
  await requireRole(Role.ADMIN)

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      include: {
        author: {
          select: { name: true, email: true, image: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    posts: posts as PostItem[],
    categories,
  }
}

export async function createPostAction(data: {
  title: string
  slug?: string
  excerpt?: string
  content: string
  coverImage?: string
  externalUrl?: string
  categoryId?: string
  status?: PostStatus
}) {
  const user = await getAuthenticatedUser()
  if (!user?.id) throw new Error('No autenticado')
  await requireRole(Role.ADMIN)

  if (!data.title.trim()) throw new Error('El título del post es obligatorio.')
  if (!data.content.trim()) throw new Error('El contenido del post es obligatorio.')

  const baseSlug = data.slug?.trim() ? generateSlug(data.slug) : generateSlug(data.title)
  let finalSlug = baseSlug

  // Verificar colisiones de slug
  const existing = await prisma.post.findUnique({
    where: { slug: finalSlug },
  })
  if (existing) {
    finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`
  }

  const post = await prisma.post.create({
    data: {
      title: data.title.trim(),
      slug: finalSlug,
      excerpt: data.excerpt?.trim() || null,
      content: data.content.trim(),
      coverImage: data.coverImage?.trim() || null,
      externalUrl: data.externalUrl?.trim() || null,
      categoryId: data.categoryId && data.categoryId !== 'none' ? data.categoryId : null,
      status: data.status || PostStatus.DRAFT,
      authorId: user.id,
      publishedAt: data.status === PostStatus.PUBLISHED ? new Date() : null,
    },
    include: {
      author: { select: { name: true, email: true, image: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  })

  revalidatePath('/admin/posts')
  revalidatePath('/chat')
  revalidatePath('/')
  return { success: true, post: post as PostItem }
}

export async function updatePostAction(
  id: string,
  data: {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    coverImage?: string
    externalUrl?: string
    categoryId?: string
    status?: PostStatus
  }
) {
  await requireRole(Role.ADMIN)

  const existing = await prisma.post.findUnique({
    where: { id },
  })
  if (!existing) throw new Error('Publicación no encontrada')

  const updateData: {
    title?: string
    slug?: string
    excerpt?: string | null
    content?: string
    coverImage?: string | null
    externalUrl?: string | null
    categoryId?: string | null
    status?: PostStatus
    publishedAt?: Date | null
  } = {}

  if (data.title !== undefined) updateData.title = data.title.trim()
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt.trim() || null
  if (data.content !== undefined) updateData.content = data.content.trim()
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage.trim() || null
  if (data.externalUrl !== undefined) updateData.externalUrl = data.externalUrl.trim() || null
  if (data.categoryId !== undefined) {
    updateData.categoryId = data.categoryId && data.categoryId !== 'none' ? data.categoryId : null
  }

  if (data.slug !== undefined && data.slug.trim() && data.slug !== existing.slug) {
    const newSlug = generateSlug(data.slug)
    const slugCheck = await prisma.post.findUnique({
      where: { slug: newSlug },
    })
    if (slugCheck && slugCheck.id !== id) {
      throw new Error('El slug ya se encuentra en uso por otra publicación.')
    }
    updateData.slug = newSlug
  }

  if (data.status !== undefined) {
    updateData.status = data.status
    if (data.status === PostStatus.PUBLISHED && !existing.publishedAt) {
      updateData.publishedAt = new Date()
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
    include: {
      author: { select: { name: true, email: true, image: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  })

  revalidatePath('/admin/posts')
  revalidatePath(`/posts/${post.slug}`)
  revalidatePath('/chat')
  revalidatePath('/')
  return { success: true, post: post as PostItem }
}

export async function togglePostStatusAction(id: string, currentStatus: PostStatus) {
  await requireRole(Role.ADMIN)

  const newStatus =
    currentStatus === PostStatus.PUBLISHED ? PostStatus.DRAFT : PostStatus.PUBLISHED

  const post = await prisma.post.update({
    where: { id },
    data: {
      status: newStatus,
      publishedAt: newStatus === PostStatus.PUBLISHED ? new Date() : undefined,
    },
    include: {
      author: { select: { name: true, email: true, image: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  })

  revalidatePath('/admin/posts')
  revalidatePath('/chat')
  revalidatePath('/')
  return { success: true, post: post as PostItem }
}

export async function deletePostAction(id: string) {
  await requireRole(Role.ADMIN)

  await prisma.post.delete({
    where: { id },
  })

  revalidatePath('/admin/posts')
  revalidatePath('/chat')
  revalidatePath('/')
  return { success: true }
}

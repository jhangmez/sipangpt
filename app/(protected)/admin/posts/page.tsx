import * as React from 'react'
import type { Metadata } from 'next'
import { getAdminPostsData } from '@/lib/actions/admin-posts'
import { PostsManager } from '@/components/admin/posts-manager'

export const metadata: Metadata = {
  title: 'Publicaciones y Posts • Panel Administrador',
  description: 'Gestión y redacción de comunicados oficiales, directivas académicas y noticias en SipánGPT.',
}

export default async function AdminPostsPage() {
  const { posts, categories } = await getAdminPostsData()

  return (
    <div className='space-y-6'>
      <PostsManager initialPosts={posts} categories={categories} />
    </div>
  )
}

import type { Metadata } from 'next'

import { getTopicCategoriesData } from '@/lib/actions/admin-topics'
import { TopicCategoriesManager } from '@/components/admin/topic-categories-manager'

export const metadata: Metadata = {
  title: 'Temas y Categorías • Panel Administrador',
  description:
    'Catálogo jerárquico de categorías temáticas y subtemas universitarios para analítica en SipánGPT.'
}

export default async function AdminCategoriesPage() {
  const categories = await getTopicCategoriesData()

  return (
    <div className='space-y-6'>
      <TopicCategoriesManager initialCategories={categories} />
    </div>
  )
}

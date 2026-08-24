import * as React from 'react'
import { getTopicCategoriesData } from '@/lib/actions/admin-topics'
import { TopicCategoriesManager } from '@/components/admin/topic-categories-manager'

export default async function AdminCategoriesPage() {
  const categories = await getTopicCategoriesData()

  return (
    <div className='space-y-6'>
      <TopicCategoriesManager initialCategories={categories} />
    </div>
  )
}

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface PostItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  externalUrl: string | null
  status: PostStatus
  publishedAt: Date | null
  createdAt: Date
  author?: {
    name: string | null
    email: string
    image: string | null
  }
  category?: {
    id: string
    name: string
    slug: string
  } | null
}

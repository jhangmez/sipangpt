export const POST_STATUSES = {
  PUBLISHED: 'PUBLISHED',
  DRAFT: 'DRAFT',
  ARCHIVED: 'ARCHIVED',
} as const

export type PostStatusType = (typeof POST_STATUSES)[keyof typeof POST_STATUSES]

export const POST_FILTER_OPTIONS = ['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const
export type PostFilterOption = (typeof POST_FILTER_OPTIONS)[number]

export const POST_STATUS_LABELS: Record<PostFilterOption, string> = {
  ALL: 'Todas',
  PUBLISHED: 'Publicadas',
  DRAFT: 'Borradores',
  ARCHIVED: 'Archivadas',
}

export const DEFAULT_POST_STATUS: PostStatusType = POST_STATUSES.PUBLISHED

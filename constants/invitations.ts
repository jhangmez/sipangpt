export const INVITATION_VALIDITY_DAYS_OPTIONS = [
  { value: 3, label: '3 días' },
  { value: 7, label: '7 días (Recomendado)' },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
] as const

export const DEFAULT_INVITATION_VALIDITY_DAYS = 7

export const INVITATION_STATUSES = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
} as const

export type InvitationStatusType = (typeof INVITATION_STATUSES)[keyof typeof INVITATION_STATUSES]

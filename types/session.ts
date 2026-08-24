export interface ActiveSessionItem {
  sessionToken: string
  userId: string
  userEmail: string
  userName?: string | null
  userImage?: string | null
  userRole?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  deviceType?: string | null
  browser?: string | null
  city?: string | null
  expires: string
  createdAt: string
  updatedAt: string
  isCurrent?: boolean
}

export interface CloseSessionResponse {
  success: boolean
  message: string
  closedToken?: string
}

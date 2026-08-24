import type { Role } from '@/lib/prisma'

export interface UserProfileData {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  image: string | null
  role: Role
  emailVerified: Date | null
  hasPassword: boolean
  createdAt: Date
}

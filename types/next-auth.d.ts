import { type DefaultSession } from 'next-auth'
import type { Role } from '@/lib/prisma'

declare module 'next-auth' {
  interface User {
    id: string
    role: Role
    firstName?: string | null
    lastName?: string | null
  }

  interface Session {
    user: {
      id: string
      role: Role
      firstName?: string | null
      lastName?: string | null
    } & DefaultSession['user']
    error?: 'RefreshTokenError'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    firstName?: string | null
    lastName?: string | null
  }
}

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma, Role } from '@/lib/prisma'
import { isInitialAdminEmail } from '@/constants/admin'
import { SESSION_LIMIT_PER_ROLE, DEFAULT_MAX_SESSIONS } from '@/constants'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      profile(profile) {
        const isAdmin = isInitialAdminEmail(profile.email)
        return {
          id: profile.sub,
          name: profile.name,
          firstName: profile.given_name ?? null,
          lastName: profile.family_name ?? null,
          email: profile.email,
          image: profile.picture,
          role: isAdmin ? Role.ADMIN : Role.USER,
        }
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user.email) return

      const isInitial = isInitialAdminEmail(user.email)

      try {
        const pendingInvitation = await prisma.adminInvitation.findFirst({
          where: {
            email: user.email.toLowerCase(),
            status: 'PENDING',
            expiresAt: { gt: new Date() },
          },
        })

        if (isInitial || pendingInvitation) {
          await prisma.user.updateMany({
            where: { email: user.email, role: { not: Role.ADMIN } },
            data: { role: Role.ADMIN },
          })

          if (pendingInvitation) {
            await prisma.adminInvitation.update({
              where: { id: pendingInvitation.id },
              data: { status: 'ACCEPTED' },
            })
          }
        }
      } catch (e) {
        console.error('[AUTH_SIGNIN_INVITATION_ERROR]', e)
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user.role as Role) || Role.USER
        token.firstName = user.firstName ?? null
        token.lastName = user.lastName ?? null
      } else if (!token.id && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, role: true, firstName: true, lastName: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.firstName = dbUser.firstName
            token.lastName = dbUser.lastName
          }
        } catch (e) {
          console.error('[AUTH_JWT_ERROR]', e)
        }
      }

      if (!token.sessionToken) {
        token.sessionToken = (token.jti as string) || `auth_sess_${token.id || 'usr'}`
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        const userId = token.id as string
        session.user.id = userId
        session.user.role = (token.role as Role) || Role.USER
        session.user.firstName = token.firstName as string | null | undefined
        session.user.lastName = token.lastName as string | null | undefined
        ;(session.user as { sessionToken?: string }).sessionToken = token.sessionToken as string

        // Control de límite de sesiones activas en base de datos
        try {
          const maxSessions =
            SESSION_LIMIT_PER_ROLE[session.user.role as keyof typeof SESSION_LIMIT_PER_ROLE] ||
            DEFAULT_MAX_SESSIONS
          const userSessions = await prisma.session.findMany({
            where: {
              userId,
              expires: { gt: new Date() },
            },
            orderBy: { updatedAt: 'asc' },
          })

          if (userSessions.length > maxSessions) {
            const sessionsToDelete = userSessions.slice(0, userSessions.length - maxSessions)
            if (sessionsToDelete.length > 0) {
              await prisma.session.deleteMany({
                where: {
                  sessionToken: {
                    in: sessionsToDelete.map((s) => s.sessionToken),
                  },
                },
              })
            }
          }

          const activeCount = await prisma.session.count({
            where: {
              userId,
              expires: { gt: new Date() },
            },
          })

          ;(session.user as { activeSessionsCount?: number }).activeSessionsCount = activeCount
          ;(session.user as { maxAllowedSessions?: number }).maxAllowedSessions = maxSessions
        } catch (err) {
          console.error('[AUTH_SESSION_LIMIT_ERROR]', err)
        }
      }
      return session
    },
  },
})

/**
 * Función auxiliar para actualizar información de sesión desde endpoints de API o Server Actions.
 */
export async function updateSessionInfo(
  sessionToken: string,
  userAgent?: string,
  ipAddress?: string
) {
  try {
    await prisma.session.update({
      where: { sessionToken },
      data: {
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('[UPDATE_SESSION_INFO_ERROR]', error)
  }
}

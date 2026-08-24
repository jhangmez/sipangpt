import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma, Role } from '@/lib/prisma'
import { isInitialAdminEmail } from '@/constants/admin'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
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
      // Auto-promoción garantizada a ADMIN para correos pre-registrados
      if (user.email && isInitialAdminEmail(user.email)) {
        await prisma.user.updateMany({
          where: { email: user.email, role: { not: Role.ADMIN } },
          data: { role: Role.ADMIN },
        })
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const isAdmin = isInitialAdminEmail(user.email)
        token.id = user.id as string
        token.role = isAdmin ? Role.ADMIN : ((user.role as Role) || Role.USER)
        token.firstName = user.firstName ?? null
        token.lastName = user.lastName ?? null
      } else if (token.email) {
        const isAdmin = isInitialAdminEmail(token.email)
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, firstName: true, lastName: true },
        })

        if (dbUser) {
          // Si el correo es de admin inicial y en BD aún figura como USER, lo promovemos
          if (isAdmin && dbUser.role !== Role.ADMIN) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { role: Role.ADMIN },
            })
            token.role = Role.ADMIN
          } else {
            token.role = dbUser.role
          }
          token.id = dbUser.id
          token.firstName = dbUser.firstName
          token.lastName = dbUser.lastName
        } else if (isAdmin) {
          token.role = Role.ADMIN
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.firstName = token.firstName as string | null | undefined
        session.user.lastName = token.lastName as string | null | undefined
      }
      return session
    },
  },
})

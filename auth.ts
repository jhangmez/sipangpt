import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma, Role } from '@/lib/prisma'

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
        return {
          id: profile.sub,
          name: profile.name,
          firstName: profile.given_name ?? null,
          lastName: profile.family_name ?? null,
          email: profile.email,
          image: profile.picture,
          role: Role.USER,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user.role as Role) || Role.USER
        token.firstName = user.firstName ?? null
        token.lastName = user.lastName ?? null
      } else if (token.email && !token.role) {
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

import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/prisma'

declare module 'next-auth' {
  interface Session {
    user: {
      role: string
    } & DefaultSession['user']
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified === true,
          role: profile.role ?? 'user',
          first_name: profile.given_name,
          last_name: profile.family_name,
          iss: profile.iss
        }
      }
    })
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async session({ session, token, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          role: user.role
        }
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? 'user'
      }
      return token
    },
    // Considera cambiar la redirección predeterminada
    async redirect({ url, baseUrl }) {
      // Permite redirecciones relativas
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Permite redirecciones al mismo dominio
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  }
})

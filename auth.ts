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
  session: {
    maxAge: 60 * 60 * 2
  },
  jwt: {
    maxAge: 60 * 60 * 2
  },
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
    async session({ session, user }) {
      const [googleAccount] = await prisma.account.findMany({
        where: { userId: user.id, provider: 'google' }
      })
      if (googleAccount?.expires_at && googleAccount.refresh_token) {
        if (googleAccount.expires_at * 1000 < Date.now()) {
          // If the access token has expired, try to refresh it
          try {
            // https://accounts.google.com/.well-known/openid-configuration
            // We need the `token_endpoint`.
            const response = await fetch(
              'https://oauth2.googleapis.com/token',
              {
                method: 'POST',
                body: new URLSearchParams({
                  client_id: process.env.AUTH_GOOGLE_ID!,
                  client_secret: process.env.AUTH_GOOGLE_SECRET!,
                  grant_type: 'refresh_token',
                  refresh_token: googleAccount.refresh_token
                })
              }
            )

            const tokensOrError = await response.json()

            if (!response.ok) throw tokensOrError

            const newTokens = tokensOrError as {
              access_token: string
              expires_in: number
              refresh_token?: string
            }

            await prisma.account.update({
              data: {
                access_token: newTokens.access_token,
                expires_at: Math.floor(
                  Date.now() / 1000 + newTokens.expires_in
                ),
                refresh_token:
                  newTokens.refresh_token ?? googleAccount.refresh_token
              },
              where: {
                provider_providerAccountId: {
                  provider: 'google',
                  providerAccountId: googleAccount.providerAccountId
                }
              }
            })
          } catch (error) {
            console.error('Error refreshing access_token', error)
            // If we fail to refresh the token, return an error so we can handle it on the page
            session.error = 'RefreshTokenError'
          }
        }
      }
      return session
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

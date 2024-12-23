import 'next-auth'
import { type DefaultSession } from 'next-auth'

declare module 'next-auth' {
  // Extiende la interfaz de User para incluir rol
  interface User {
    role?: string
  }

  // Extiende la interfaz de Session para incluir rol en user
  interface Session {
    user: {
      role?: string
    } & DefaultSession['user']
    error?: 'RefreshTokenError'
  }
}

// Si también quieres extender el JWT
// import { type JWT } from 'next-auth/jwt'

// declare module 'next-auth/jwt' {
//   interface JWT {
//     role?: string
//   }
// }

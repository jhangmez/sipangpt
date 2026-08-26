import type * as React from 'react'
import { requireAuth } from '@/lib/session'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Guard a nivel de Server Component: redirige a /login si no está autenticado
  await requireAuth()

  return (
    <div className='flex h-screen w-full overflow-hidden bg-background text-foreground font-exo'>
      {children}
    </div>
  )
}

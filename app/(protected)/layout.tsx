import { requireAuth } from '@/lib/session'
import { Navbar } from '@/components/shared/navbar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Guard a nivel de Server Component: redirige a /login si no está autenticado
  await requireAuth()

  return (
    <div className='flex min-h-screen flex-col bg-background text-foreground font-exo'>
      <Navbar />
      <div className='flex-1 flex flex-col'>{children}</div>
    </div>
  )
}

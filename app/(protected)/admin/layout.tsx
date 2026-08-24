import { requireRole } from '@/lib/session'
import { Role } from '@/lib/prisma'
import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Guard de rol de Server Component: solo permite el acceso a usuarios con rol ADMIN
  await requireRole(Role.ADMIN)

  return (
    <div className='flex-1 container mx-auto px-4 py-8 max-w-6xl flex flex-col md:flex-row gap-6'>
      {/* Navegación Administrativa */}
      <aside className='w-full md:w-64 rounded-2xl border border-border/60 bg-card p-4 space-y-2 shrink-0'>
        <div className='pb-3 mb-2 border-b border-border/40'>
          <h2 className='font-frances font-bold text-lg text-foreground'>
            Panel de Control
          </h2>
          <p className='text-xs text-muted-foreground font-exo'>
            Gestión Institucional SipánGPT
          </p>
        </div>

        <nav className='space-y-1 font-exo text-sm'>
          <Link
            href='/admin/dashboard'
            className='flex items-center gap-2.5 rounded-xl px-3 py-2 text-primary bg-primary/10 font-medium'
          >
            <LayoutDashboard className='w-4 h-4' />
            Dashboard y Métricas
          </Link>
        </nav>
      </aside>

      {/* Contenido Principal de Administración */}
      <div className='flex-1'>{children}</div>
    </div>
  )
}

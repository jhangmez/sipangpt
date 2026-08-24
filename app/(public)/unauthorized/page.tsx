import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, House } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Acceso Denegado (403)',
  description: 'No cuentas con los permisos requeridos para acceder a este recurso institucional.',
}

export default function UnauthorizedPage() {
  return (
    <main className='flex min-h-[calc(100vh-4rem)] items-center justify-center px-4'>
      <div className='w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-8 shadow-lg text-center space-y-6'>
        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-sm'>
          <ShieldAlert className='h-8 w-8' />
        </div>

        <div className='space-y-2'>
          <h1 className='font-frances text-2xl font-bold text-foreground'>
            Acceso Denegado (403)
          </h1>
          <p className='text-sm text-muted-foreground font-exo'>
            No tienes los permisos requeridos o tu rol no cuenta con acceso a esta sección del sistema.
          </p>
        </div>

        <div className='flex flex-col gap-3 pt-2'>
          <Link
            href='/chat'
            className={cn(
              buttonVariants({ variant: 'default' }),
              'flex items-center justify-center gap-2 w-full font-semibold h-11'
            )}
          >
            <ArrowLeft className='w-4 h-4' />
            Regresar al Chat
          </Link>
          <Link
            href='/'
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'flex items-center justify-center gap-2 w-full font-semibold h-11'
            )}
          >
            <House className='w-4 h-4' />
            Ir a Inicio
          </Link>
        </div>
      </div>
    </main>
  )
}

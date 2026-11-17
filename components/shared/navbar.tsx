import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { UserButton } from '@/components/shared/user-button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Bot, MessageSquare, LogIn, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MobileMenu } from '@/components/landing/mobile-menu'

export async function Navbar() {
  const user = await getCurrentUser()

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-all shadow-2xs'>
      <div className='max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Logo y Marca Institucional */}
        <Link href='/' className='flex items-center gap-2.5 group shrink-0'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105'>
            <Bot className='h-5 w-5' />
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-frances font-bold text-xl text-foreground tracking-tight'>
              Sipán<span className='text-primary'>GPT</span>
            </span>
            <span className='hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary font-exo'>
              USS
            </span>
          </div>
        </Link>

        {/* Enlaces de Navegación Centrales (Despejados y limpios) */}
        <nav className='hidden md:flex items-center gap-6 text-[13px] font-medium font-exo'>
          <Link
            href='/#documentos-indexados'
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            Reglamentos (13)
          </Link>
          <Link
            href='/#stair'
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            Metodología STAIR
          </Link>
          <Link
            href='/#benchmark'
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            Benchmark UNPRG
          </Link>
        </nav>

        {/* Acciones del Lado Derecho (Sin redundancias) */}
        <div className='flex items-center gap-3 shrink-0'>
          <ThemeToggle />

          {/* Botón único de acción según estado de sesión */}
          {user ? (
            <div className='flex items-center gap-2.5'>
              <Link
                href='/chat'
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                  'gap-1.5 font-exo font-semibold text-xs px-3.5 h-9 rounded-lg shadow-xs'
                )}
              >
                <MessageSquare className='w-3.5 h-3.5' />
                <span>Ir al Chat</span>
              </Link>
              <UserButton user={user} />
            </div>
          ) : (
            <Link
              href='/login'
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'gap-1.5 font-exo font-semibold text-xs px-4 h-9 rounded-lg shadow-xs hover:shadow-sm transition-all'
              )}
            >
              <LogIn className='w-3.5 h-3.5' />
              <span>Iniciar Sesión</span>
            </Link>
          )}

          {/* Menú Móvil */}
          <MobileMenu isLoggedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  )
}

import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { UserButton } from '@/components/shared/user-button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Bot, MessageSquare, Sparkles, LogIn, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MobileMenu } from '@/components/landing/mobile-menu'

export async function Navbar() {
  const user = await getCurrentUser()

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md transition-all shadow-2xs'>
      <div className='max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Logo y Marca Institucional */}
        <div className='flex items-center gap-3'>
          <Link href='/' className='flex items-center gap-2.5 group'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105'>
              <Bot className='h-5 w-5' />
            </div>
            <div className='flex items-center gap-2'>
              <span className='font-frances font-bold text-xl text-foreground tracking-tight'>
                Sipán<span className='text-primary'>GPT</span>
              </span>
              <span className='hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-semibold text-primary font-exo'>
                <Sparkles className='w-2.5 h-2.5' />
                <span>USS • v2.0</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Enlaces de Navegación Centrales (Desktop) */}
        <nav className='hidden md:flex items-center gap-1 text-[13px] font-medium font-exo'>
          <Link
            href='/'
            className='px-3 py-1.5 rounded-lg text-foreground font-semibold hover:bg-muted/60 transition-colors'
          >
            Inicio
          </Link>
          <Link
            href='/#documentos-indexados'
            className='px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
          >
            Reglamentos (13)
          </Link>
          <Link
            href='/#stair'
            className='px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
          >
            Arquitectura STAIR
          </Link>
          <Link
            href='/#arquetipos'
            className='px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
          >
            Roles USS
          </Link>
          <Link
            href='/#benchmark'
            className='px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
          >
            Benchmark UNPRG
          </Link>
        </nav>

        {/* Acciones del Lado Derecho */}
        <div className='flex items-center gap-2.5'>
          {/* Indicador de Estado del Sistema (Desktop Grande) */}
          <div className='hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border/70 text-[11px] font-mono text-muted-foreground'>
            <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
            <span>13 Docs RAG Activo</span>
          </div>

          <ThemeToggle />

          {/* Botones de Autenticación / Chat */}
          {user ? (
            <div className='flex items-center gap-2'>
              <Link
                href='/chat'
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                  'hidden sm:inline-flex gap-1.5 font-exo font-semibold text-xs px-3.5 h-9 rounded-lg shadow-xs'
                )}
              >
                <MessageSquare className='w-3.5 h-3.5' />
                <span>Ir al Chat</span>
              </Link>
              <UserButton user={user} />
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <Link
                href='/chat'
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'hidden sm:inline-flex gap-1.5 font-exo text-xs font-semibold hover:bg-muted/60'
                )}
              >
                <MessageSquare className='w-3.5 h-3.5 text-primary' />
                <span>Chatbot</span>
              </Link>

              <Link
                href='/login'
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                  'gap-1.5 font-exo font-semibold text-xs px-3.5 h-9 rounded-lg shadow-xs hover:shadow-sm transition-all'
                )}
              >
                <LogIn className='w-3.5 h-3.5' />
                <span>Iniciar Sesión</span>
              </Link>
            </div>
          )}

          {/* Menú Móvil */}
          <MobileMenu isLoggedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  )
}

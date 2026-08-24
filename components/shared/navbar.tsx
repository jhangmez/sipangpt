import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { UserButton } from '@/components/shared/user-button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Bot, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function Navbar() {
  const user = await getCurrentUser()

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4 sm:px-8'>
        {/* Logo y Nombre */}
        <Link href='/' className='flex items-center gap-2 font-frances font-bold text-xl text-foreground'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
            <Bot className='h-5 w-5' />
          </div>
          <span>Sipán<span className='text-primary'>GPT</span></span>
        </Link>

        {/* Enlaces de Navegación */}
        <nav className='hidden md:flex items-center gap-6 text-sm font-medium font-exo'>
          <Link href='/' className='text-muted-foreground transition hover:text-foreground'>
            Inicio
          </Link>
          <Link href='/chat' className='text-muted-foreground transition hover:text-foreground flex items-center gap-1'>
            <MessageSquare className='w-4 h-4' />
            Chatbot
          </Link>
        </nav>

        {/* Acciones: Toggle Tema y Usuario */}
        <div className='flex items-center gap-3'>
          <ThemeToggle />
          <UserButton user={user} />
        </div>
      </div>
    </header>
  )
}

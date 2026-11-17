'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Menu,
  X,
  BookOpen,
  GitBranch,
  Users2,
  Award,
  MessageSquare,
  LogIn,
  Bot
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileMenuProps {
  isLoggedIn?: boolean
}

export function MobileMenu({ isLoggedIn }: MobileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const toggleMenu = () => setIsOpen((prev) => !prev)
  const closeMenu = () => setIsOpen(false)

  return (
    <div className='md:hidden'>
      <Button
        variant='ghost'
        size='icon'
        onClick={toggleMenu}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        className='rounded-lg text-muted-foreground hover:text-foreground'
      >
        {isOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
      </Button>

      {isOpen && (
        <div className='fixed inset-x-0 top-16 z-50 border-b border-border/80 bg-background/95 backdrop-blur-xl p-5 shadow-2xl font-exo animate-in slide-in-from-top-2 duration-200'>
          <div className='flex flex-col space-y-3'>
            <div className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/40'>
              Navegación del Asistente
            </div>

            <Link
              href='/'
              onClick={closeMenu}
              className='flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors'
            >
              <Bot className='w-4 h-4 text-primary' />
              <span>Inicio</span>
            </Link>

            <Link
              href='/#documentos-indexados'
              onClick={closeMenu}
              className='flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
            >
              <BookOpen className='w-4 h-4 text-primary' />
              <span>13 Reglamentos USS</span>
            </Link>

            <Link
              href='/#stair'
              onClick={closeMenu}
              className='flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
            >
              <GitBranch className='w-4 h-4 text-primary' />
              <span>Arquitectura STAIR</span>
            </Link>

            <Link
              href='/#arquetipos'
              onClick={closeMenu}
              className='flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
            >
              <Users2 className='w-4 h-4 text-primary' />
              <span>Roles Universitarios</span>
            </Link>

            <Link
              href='/#benchmark'
              onClick={closeMenu}
              className='flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
            >
              <Award className='w-4 h-4 text-primary' />
              <span>Benchmark UNPRG</span>
            </Link>

            <div className='pt-3 border-t border-border/50 flex flex-col gap-2'>
              <Link
                href='/chat'
                onClick={closeMenu}
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'w-full justify-center gap-2 font-semibold shadow-xs'
                )}
              >
                <MessageSquare className='w-4 h-4' />
                <span>{isLoggedIn ? 'Ir al Chat' : 'Probar Chatbot'}</span>
              </Link>

              {!isLoggedIn && (
                <Link
                  href='/login'
                  onClick={closeMenu}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full justify-center gap-2'
                  )}
                >
                  <LogIn className='w-4 h-4' />
                  <span>Acceso Institucional</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

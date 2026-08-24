'use client'

import { signIn } from 'next-auth/react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LogIn, LogOut, Shield } from 'lucide-react'
import Link from 'next/link'
import { performSafeLogout } from '@/lib/auth/multi-tab-sync'

interface UserButtonProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  } | null
}

export function UserButton({ user }: UserButtonProps) {
  if (!user) {
    return (
      <Button
        onClick={() => signIn('google')}
        size='sm'
        className='gap-2 font-medium font-exo'
      >
        <LogIn className='w-4 h-4' />
        Iniciar Sesión
      </Button>
    )
  }

  const handleSignOut = () => {
    performSafeLogout('/')
  }

  return (
    <div className='flex items-center gap-3'>
      {user.role === 'ADMIN' && (
        <Link
          href='/admin/dashboard'
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'gap-1 text-xs flex items-center'
          )}
        >
          <Shield className='w-3.5 h-3.5 text-primary' />
          Admin
        </Link>
      )}

      <div className='flex items-center gap-2'>
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || 'Usuario'}
            className='w-8 h-8 rounded-full border border-border object-cover'
          />
        ) : (
          <div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs'>
            {user.name?.[0] || 'U'}
          </div>
        )}
        <span className='hidden md:inline-block text-sm font-medium'>
          {user.name}
        </span>
      </div>

      <Button
        variant='ghost'
        size='icon'
        onClick={handleSignOut}
        title='Cerrar Sesión'
        className='rounded-full text-muted-foreground hover:text-destructive cursor-pointer'
      >
        <LogOut className='w-4 h-4' />
      </Button>
    </div>
  )
}

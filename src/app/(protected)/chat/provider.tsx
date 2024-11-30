'use client'

import { useSession } from 'next-auth/react'
import { AuthLayout } from '@/components/(private)/auth-layout'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export function Provider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <AuthLayout title='SipánGPT'>
        <div className='flex flex-col items-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='mt-4 text-muted-foreground font-semibold font-exo'>
            Cargando...
          </p>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  return <>{children}</>
}

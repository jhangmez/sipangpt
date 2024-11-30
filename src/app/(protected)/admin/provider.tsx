'use client'

import { Link } from '@nextui-org/link'
import { useSession } from 'next-auth/react'
import { AuthLayout } from '@/components/(private)/auth-layout'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
export function Provider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <AuthLayout title='SipánGPT'>
        <div className='flex flex-col items-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='mt-4 text-muted-foreground font-semibold font-exo'>
            Verificando acceso...
          </p>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <AuthLayout title='SipánGPT'>
        <div className='flex flex-col items-center'>
          <p className='mb-4 text-muted-foreground font-semibold font-exo'>
            Acceso denegado.
          </p>
          <Button asChild>
            <Link href='/login' className='font-exo font-semibold'>
              Ingresar
            </Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }
  return <>{children}</>
}

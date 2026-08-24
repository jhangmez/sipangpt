'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { acceptAdminInvitation } from '@/lib/actions/admin-invitations'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ShieldCheck, LogIn, CheckCircle2, AlertCircle, Bot } from 'lucide-react'
import Link from 'next/link'
import { getErrorMessage } from '@/lib/utils'

interface AcceptInvitationCardProps {
  token: string
  invitationEmail: string
  currentUserEmail?: string | null
  expiresAt: string
  isValid: boolean
  errorMessage?: string
}

export function AcceptInvitationCard({
  token,
  invitationEmail,
  currentUserEmail,
  expiresAt,
  isValid,
  errorMessage,
}: AcceptInvitationCardProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = React.useState(false)

  const isEmailMatching =
    currentUserEmail &&
    currentUserEmail.toLowerCase() === invitationEmail.toLowerCase()

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const res = await acceptAdminInvitation(token)
      if (res.success) {
        toast.success('¡Rol de Administrador asignado con éxito!')
        router.push('/admin/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || 'Error al aceptar la invitación')
      setIsAccepting(false)
    }
  }

  return (
    <div className='max-w-md w-full mx-auto rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl text-center space-y-6 font-exo'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/20'>
        <ShieldCheck className='h-8 w-8' />
      </div>

      <div className='space-y-2'>
        <h1 className='font-frances text-2xl font-bold text-foreground'>
          Invitación de Administrador
        </h1>
        <p className='text-xs text-muted-foreground leading-relaxed'>
          Has sido invitado a formar parte del equipo de administración institucional de <span className='font-semibold text-foreground'>SipánGPT</span> en la Universidad Señor de Sipán.
        </p>
      </div>

      {!isValid ? (
        <div className='rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2 text-xs text-rose-600 dark:text-rose-400'>
          <AlertCircle className='h-5 w-5 mx-auto' />
          <p className='font-semibold'>{errorMessage || 'Enlace inválido o expirado'}</p>
          <div className='pt-2'>
            <Button render={<Link href='/login' />} variant='outline' size='sm' className='rounded-xl text-xs'>
              Ir al Inicio de Sesión
            </Button>
          </div>
        </div>
      ) : !currentUserEmail ? (
        <div className='space-y-4 pt-2'>
          <div className='rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground'>
            Invitación emitida para: <span className='font-bold text-foreground'>{invitationEmail}</span>
          </div>
          <Button
            onClick={() => signIn('google', { redirectTo: `/invitacion/${token}` })}
            className='w-full gap-2 rounded-xl text-xs font-semibold py-3 cursor-pointer shadow-xs'
          >
            <LogIn className='w-4 h-4' /> Iniciar Sesión para Aceptar
          </Button>
        </div>
      ) : !isEmailMatching ? (
        <div className='rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs text-amber-700 dark:text-amber-300'>
          <AlertCircle className='h-5 w-5 mx-auto' />
          <p className='font-semibold'>Cuenta no coincidente</p>
          <p className='text-[11px] leading-relaxed'>
            Esta invitación fue creada para <strong>{invitationEmail}</strong>, pero tu sesión actual es <strong>{currentUserEmail}</strong>.
          </p>
          <div className='pt-2 flex justify-center gap-2'>
            <Button
              onClick={() => signIn('google', { redirectTo: `/invitacion/${token}` })}
              variant='outline'
              size='sm'
              className='rounded-xl text-xs'
            >
              Cambiar de Cuenta
            </Button>
          </div>
        </div>
      ) : (
        <div className='space-y-4 pt-2'>
          <div className='rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2'>
            <CheckCircle2 className='w-4 h-4 shrink-0' />
            <span>Cuenta verificada: <strong>{currentUserEmail}</strong></span>
          </div>

          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className='w-full gap-2 rounded-xl text-xs font-semibold py-3 cursor-pointer shadow-xs'
          >
            {isAccepting ? (
              <span>Procesando...</span>
            ) : (
              <>
                <ShieldCheck className='w-4 h-4' /> Aceptar Rol de Administrador
              </>
            )}
          </Button>
        </div>
      )}

      <div className='pt-2 border-t border-border/40 text-[11px] text-muted-foreground'>
        Universidad Señor de Sipán • Plataforma Inteligente SipánGPT
      </div>
    </div>
  )
}

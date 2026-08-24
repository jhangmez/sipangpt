import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { signIn } from '@/auth'
import { Button } from '@/components/ui/button'
import { Bot, LogIn } from 'lucide-react'

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser()
  const { callbackUrl } = await searchParams

  if (user) {
    redirect(callbackUrl || '/chat')
  }

  return (
    <main className='flex min-h-[calc(100vh-4rem)] items-center justify-center px-4'>
      <div className='w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 shadow-lg text-center space-y-6'>
        {/* Logo */}
        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md'>
          <Bot className='h-8 w-8' />
        </div>

        {/* Título y Subtítulo */}
        <div className='space-y-2'>
          <h1 className='font-frances text-2xl font-bold text-foreground'>
            Iniciar Sesión en SipánGPT
          </h1>
          <p className='text-sm text-muted-foreground font-exo'>
            Accede con tu cuenta institucional o autorizada para consultar al asistente de IA.
          </p>
        </div>

        {/* Botón Server Action de Google OAuth */}
        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: callbackUrl || '/chat' })
          }}
          className='w-full pt-2'
        >
          <Button
            type='submit'
            size='lg'
            className='w-full gap-3 font-semibold text-base h-12 shadow-sm'
          >
            <LogIn className='w-5 h-5' />
            Continuar con Google
          </Button>
        </form>

        <p className='text-xs text-muted-foreground pt-4 border-t border-border/40'>
          Al iniciar sesión, aceptas los términos de uso y las políticas de privacidad universitarias.
        </p>
      </div>
    </main>
  )
}

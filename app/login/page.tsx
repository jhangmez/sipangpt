'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Bot } from 'lucide-react'

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' width='20' height='20' {...props}>
      <path
        fill='#4285F4'
        d='M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z'
      />
      <path
        fill='#34A853'
        d='M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z'
      />
      <path
        fill='#FBBC05'
        d='M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z'
      />
      <path
        fill='#EA4335'
        d='M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z'
      />
    </svg>
  )
}

export default function LoginRegisterPage() {
  const [isLogin, setIsLogin] = React.useState(true)
  const [isSigningIn, setIsSigningIn] = React.useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()
  const isLoading = status === 'loading' || isSigningIn

  React.useEffect(() => {
    // Si ya hay una sesión activa, redirigir según el rol
    if (status === 'authenticated') {
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else {
        router.push('/chat')
      }
    }
  }, [status, session, router])

  const toggleForm = () => setIsLogin(!isLogin)

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await signIn('google', {
        callbackUrl: '/chat',
      })
    } catch (error) {
      console.error('Error during sign in:', error)
      setIsSigningIn(false)
    }
  }

  // Si ya está autenticado, no mostrar el formulario mientras redirige
  if (status === 'authenticated') {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center font-exo'>
        <Loader2 className='h-8 w-8 animate-spin text-primary mb-4' />
        <p className='text-sm text-muted-foreground'>Redirigiendo a tu espacio de trabajo...</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex flex-col sm:flex-row'>
      {/* Sección Izquierda Destacada */}
      <div className='bg-primary/95 text-primary-foreground w-full sm:w-1/2 flex items-center justify-center p-8 sm:p-12 transition-colors'>
        <div className='text-center max-w-md'>
          <div className='inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-background/20 backdrop-blur-md mb-4 shadow-sm'>
            <Bot className='h-8 w-8 text-primary-foreground' />
          </div>
          <Link
            href='/'
            className='block text-4xl sm:text-5xl font-bold mb-4 font-frances tracking-tight hover:opacity-90 transition-opacity'
          >
            SipánGPT
          </Link>
          <p className='text-sm sm:text-base font-exo font-medium leading-relaxed opacity-95'>
            Proyecto de tesis académica de{' '}
            <a
              href='https://www.linkedin.com/in/jhangmez'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-4 font-bold hover:text-foreground transition-colors'
            >
              @jhangmez
            </a>{' '}
            para la{' '}
            <span className='font-bold'>
              Universidad Señor de Sipán
            </span>
          </p>
          <p className='text-xs mt-4 opacity-80 leading-relaxed font-exo'>
            Inteligencia artificial con fundamentación RAG en reglamentos, guías y trámites universitarios.
          </p>
        </div>
      </div>

      {/* Separador de onda SVG responsivo */}
      <svg
        viewBox='0 0 1440 58'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        width='100%'
        className='flex sm:hidden text-primary/95 fill-current -mt-1'
      >
        <path
          d='M-100 58C-100 58 218.416 36.3297 693.5 36.3297C1168.58 36.3297 1487 58 1487 58V-3.8147e-06H-100V58Z'
          fill='currentColor'
        />
      </svg>

      {/* Sección Derecha: Formulario de Acceso */}
      <div className='w-full sm:w-1/2 flex items-center justify-center p-6 sm:p-12'>
        <Card className='w-full max-w-md font-exo border-border/80 shadow-md'>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle className='font-frances text-2xl font-bold'>
              {isLoading ? (
                <span className='flex items-center justify-center gap-2'>
                  <Loader2 className='h-5 w-5 animate-spin text-primary' />
                  Conectando...
                </span>
              ) : isLogin ? (
                'Iniciar sesión'
              ) : (
                'Registrarse'
              )}
            </CardTitle>
            <p className='text-xs text-muted-foreground'>
              {isLogin
                ? 'Ingresa con tu cuenta institucional o autorizada de Google'
                : 'Crea tu perfil universitario vinculado a Google OAuth'}
            </p>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Button
              variant='outline'
              className='w-full h-12 text-sm font-semibold gap-3 border-border/80 hover:bg-muted/50 cursor-pointer shadow-2xs'
              disabled={isLoading}
              onClick={handleGoogleSignIn}
            >
              {isLoading ? (
                <Loader2 className='h-5 w-5 animate-spin text-primary' />
              ) : (
                <GoogleIcon className='h-5 w-5' />
              )}
              <span>
                {isLoading
                  ? 'Redirigiendo a Google...'
                  : isLogin
                  ? 'Iniciar sesión con Google'
                  : 'Registrarse con Google'}
              </span>
            </Button>

            <div className='text-center text-xs text-muted-foreground leading-relaxed pt-2'>
              Al {isLogin ? 'ingresar' : 'registrarte'} aceptas nuestros{' '}
              <Link
                href='/terms#condiciones'
                className='text-primary font-semibold hover:underline'
              >
                Términos de uso
              </Link>{' '}
              y la{' '}
              <Link
                href='/terms#politica'
                className='text-primary font-semibold hover:underline'
              >
                Política de privacidad
              </Link>
              .
            </div>
          </CardContent>
          <CardFooter className='pt-2 border-t border-border/40'>
            <p className='text-xs text-center w-full text-muted-foreground'>
              {isLogin ? '¿No tienes una cuenta aún?' : '¿Ya tienes una cuenta registrada?'}
              <Button
                variant='link'
                onClick={toggleForm}
                className='pl-1.5 text-xs text-primary font-semibold hover:underline'
              >
                {isLogin ? 'Registrarse' : 'Iniciar sesión'}
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { FcGoogle } from 'react-icons/fc'
import Link from 'next/link'

export default function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true)

  const toggleForm = () => setIsLogin(!isLogin)

  return (
    <div className='min-h-screen flex flex-col sm:flex-row'>
      <div className='bg-[#7dfa00] w-full sm:w-1/2 flex items-center justify-center p-8'>
        <div className='text-center text-gray-sipan'>
          <Link
            href={'/'}
            className='text-4xl font-bold mb-3 font-frances hover:underline'
          >
            SipánGPT
          </Link>
          <p className='text-sm font-exo font-semibold'>
            Proyecto de tesis de{' '}
            <a
              href='https://www.linkedin.com/in/jhangmez'
              target='_blank'
              rel='noopener noreferrer'
              className='underline hover:text-gray-100'
            >
              @jhangmez
            </a>{' '}
            para la{' '}
            <a
              href='https://www.linkedin.com/in/jhangmez'
              target='_blank'
              rel='noopener noreferrer'
              className='underline hover:text-gray-100'
            >
              Universidad Señor de Sipán
            </a>
          </p>
        </div>
      </div>
      <svg
        viewBox='0 0 1440 58'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        width='100%'
        className='dark:text-gray-sipan flex sm:hidden'
      >
        <path
          d='M-100 58C-100 58 218.416 36.3297 693.5 36.3297C1168.58 36.3297 1487 58 1487 58V-3.8147e-06H-100V58Z'
          fill='#7dfa00'
        ></path>
      </svg>
      <div className='w-full sm:w-1/2 flex items-center justify-center p-8'>
        <Card className='w-full max-w-md font-exo'>
          <CardHeader>
            <CardTitle className='font-frances'>
              {isLogin ? 'Iniciar sesión' : 'Registrarse'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant='outline'
              className='w-full'
              asChild
              onClick={() => {
                /* Add Google sign-in logic here */
              }}
            >
              <Link href='/chat'>
                {/* Quitar la redirección luego de añadir credenciales */}
                <FcGoogle className='mr-2 h-4 w-4' />
                {isLogin
                  ? 'Iniciar sesión con Google'
                  : 'Registrarse con Google'}
              </Link>
            </Button>
            <div className='mt-4 text-center text-sm'>
              Al {isLogin ? 'ingresar' : 'registrarte'} aceptas nuestros{' '}
              <a href='#' className='text-primary hover:underline'>
                Términos de uso
              </a>{' '}
              y{' '}
              <a href='#' className='text-primary hover:underline'>
                Política de privacidad
              </a>
              .
            </div>
          </CardContent>
          <CardFooter>
            <p className='text-sm text-center w-full'>
              {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
              <Button variant='link' onClick={toggleForm} className='pl-1'>
                {isLogin ? 'Registrarse' : 'Iniciar sesión'}
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

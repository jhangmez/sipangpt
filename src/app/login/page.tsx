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

export default function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true)

  const toggleForm = () => setIsLogin(!isLogin)

  return (
    <div className='min-h-screen flex flex-col sm:flex-row'>
      <div className='bg-primary w-full sm:w-1/2 flex items-center justify-center p-8'>
        <div className='text-center dark:text-background'>
          <h1 className='text-4xl font-bold mb-2 font-frances'>SipánGPT</h1>
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
              USS
            </a>
          </p>
        </div>
      </div>
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
              onClick={() => {
                /* Add Google sign-in logic here */
              }}
            >
              <FcGoogle className='mr-2 h-4 w-4' />
              {isLogin ? 'Iniciar sesión con Google' : 'Registrarse con Google'}
            </Button>
            <div className='mt-4 text-center text-sm'>
              <a href='#' className='text-primary hover:underline'>
                Términos de uso
              </a>{' '}
              &bull;{' '}
              <a href='#' className='text-primary hover:underline'>
                Política de privacidad
              </a>
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

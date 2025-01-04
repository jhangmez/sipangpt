'use client'
import React from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'

export default function CallToAction() {
  return (
    <section className='bg-primary py-16 md:py-24'>
      <div className='container mx-auto px-4 text-center'>
        <h2 className='text-3xl md:text-4xl font-bold text-gray-sipan mb-6 font-frances'>
          ¡Prueba SipánGPT Ahora!
        </h2>
        <p className='text-gray-sipan font-semibold text-lg md:text-xl mb-8 font-exo'>
          Animate a que SipánGPT responda todas tus preguntas sobre la
          Universidad Señor de Sipán.
        </p>
        <Link href='/login'>
          <Button
            variant='outline'
            size='lg'
            className='font-exo bg-gray-100 dark:bg-gray-sipan font-semibold'
          >
            Empezar
          </Button>
        </Link>
      </div>
    </section>
  )
}

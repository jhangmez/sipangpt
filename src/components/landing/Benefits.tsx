'use client'
import React from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'

export default function Benefits() {
  return (
    <section className='py-16 md:py-24 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <h2 className='text-3xl md:text-4xl font-bold text-center text-gray-sipan mb-12 font-frances'>
          Beneficios de Usar SipánGPT
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
          <div className='flex flex-col items-center md:items-start'>
            <ul className='list-disc space-y-6'>
              <li className='flex items-start'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6 text-green-500 mt-1 mr-3'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                <p className='text-gray-sipan font-exo'>
                  <strong className='font-frances text-lg'>
                    Acceso Rápido a la Información:
                  </strong>{' '}
                  Encuentra respuestas inmediatas a tus preguntas sobre
                  admisiones, carreras, trámites y más.
                </p>
              </li>
              <li className='flex items-start'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6 text-green-500 mt-1 mr-3'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                <p className='text-gray-sipan font-exo'>
                  <strong className='font-frances text-lg'>
                    Experiencia Personalizada:
                  </strong>{' '}
                  SipánGPT se adapta a tus necesidades específicas, brindándote
                  información relevante para ti.
                </p>
              </li>
              <li className='flex items-start'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6 text-green-500 mt-1 mr-3'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                <p className='text-gray-sipan font-exo'>
                  <strong className='font-frances text-lg'>
                    Soporte Constante:
                  </strong>{' '}
                  Resuelve tus dudas al instante, sin largas esperas.
                </p>
              </li>
              <li className='flex items-start'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6 text-green-500 mt-1 mr-3'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                <p className='text-gray-sipan font-exo'>
                  <strong className='font-frances text-lg'>
                    Ideal para Nuevos Estudiantes:
                  </strong>{' '}
                  Facilita tu adaptación a la universidad y resuelve todas tus
                  dudas iniciales.
                </p>
              </li>
            </ul>
          </div>

          {/* Imagen o Ilustración */}
          <div className='flex justify-center'>
            <img
              src='/images/sipangpt-uso.webp'
              alt='Estudiante usando SipánGPT'
              className='w-full max-w-md shadow-md'
            />
          </div>
        </div>
        <div className='mt-16 text-center'>
          <Link href='/chat'>
            <Button
              size='lg'
              className='w-full md:w-auto text-gray-sipan text-lg font-frances bg-primary hover:bg-primary/90'
            >
              Descubre cómo SipánGPT puede ayudarte
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

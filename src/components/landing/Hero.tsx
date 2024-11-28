'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'
import { LiteYoutubeEmbed } from 'react-lite-yt-embed'

export default function Hero() {
  return (
    <section className='bg-gray-100'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-24'>
        <div className='flex flex-col md:flex-row items-center justify-between'>
          <div className='w-full md:w-1/2 mb-8 md:mb-0 text-gray-sipan font-exo'>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-frances'>
              Pregunta a SipánGPT
            </h1>
            <h2 className='text-xl md:text-2xl lg:text-3xl mb-6 font-semibold'>
              Pregunta todas tus dudas sobre la universidad Señor de Sipán
            </h2>
            <Link href='/login'>
              <Button size='lg' className='font-semibold'>
                Empezar
              </Button>
            </Link>
            <p className='text-sm mt-4'>
              Proyecto de tesis de{' '}
              <Link
                href='https://www.linkedin.com/in/jhangmez'
                className='text-blue-600 hover:underline'
              >
                @jhangmez
              </Link>
            </p>
          </div>
          <div className='w-full md:w-1/2 hidden md:block'>
            <div className='relative w-full pt-[56.25%]'>
              <div className='absolute inset-0 bg-primary opacity-20 blur-md rounded-lg'></div>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '0.5rem', // Equivale a rounded-lg
                  boxShadow:
                    '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)' // Equivale a shadow-lg
                }}
              >
                <LiteYoutubeEmbed id='2LOqqknFcQg' defaultPlay mute noCookie />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

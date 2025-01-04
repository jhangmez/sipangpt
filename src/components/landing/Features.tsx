'use client'
import React from 'react'
import { LiteYoutubeEmbed } from 'react-lite-yt-embed'

export default function Features() {
  return (
    <section className='py-16 md:py-24 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <h2 className='text-3xl md:text-4xl font-bold text-center text-gray-sipan mb-12 font-frances'>
          Funcionalidades clave de SipánGPT
        </h2>
        {/* Característica 3: Disponibilidad */}
        <div className='flex flex-col items-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-12 w-12 text-[#5fed00] mb-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <h3 className='text-xl md:text-2xl font-semibold text-gray-sipan mb-4 font-frances text-center'>
            Disponible de 8:00 a.m. a 8:00 p.m.
          </h3>
          <p className='text-gray-600 text-center font-exo'>
            Accede a SipánGPT en el horario que más te acomode.
          </p>
        </div>
        <div className='mx-auto px-4 lg:px-0 max-w-7xl'>
          {/* Contenedor centrado y más ancho */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-12 lg:p-5 md:p-5 py-5'>
            {/* Característica 1: Precisión en las Respuestas */}
            <div className='flex flex-col items-center'>
              <div className='w-full mb-8'>
                {' '}
                {/* Contenedor para el video */}
                <section className='relative w-full pt-[56.25%]'>
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
                    <LiteYoutubeEmbed
                      id='PWuDK4ZZ2Sk'
                      desktopResolution='hqdefault'
                      iframeTitle='SipánGPT - Respuestas precisas'
                      defaultPlay
                      mute
                      noCookie
                      params={{
                        rel: '0',
                        modestbranding: '1',
                        showinfo: '0',
                        controls: '0',
                        autoplay: '1',
                        loop: '1',
                        playlist: 'PWuDK4ZZ2Sk'
                      }}
                    />
                  </div>
                </section>
              </div>

              <h3 className='text-xl md:text-2xl font-semibold text-gray-sipan mb-4 font-frances'>
                Precisión en las Respuestas
              </h3>
              <p className='text-gray-600 text-center font-exo'>
                SipánGPT te pide más detalles para brindarte la información
                exacta que necesitas.
              </p>
            </div>

            {/* Característica 2: Corrección Inteligente */}
            <div className='flex flex-col items-center'>
              <div className='w-full mb-8'>
                {' '}
                {/* Contenedor para el video */}
                <section className='relative w-full pt-[56.25%]'>
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
                    <LiteYoutubeEmbed
                      id='nWJbLSSZQPU'
                      desktopResolution='hqdefault'
                      iframeTitle='SipánGPT - Corrección inteligente'
                      defaultPlay
                      mute
                      noCookie
                      params={{
                        rel: '0',
                        modestbranding: '1',
                        showinfo: '0',
                        controls: '0',
                        autoplay: '1',
                        loop: '1',
                        playlist: 'nWJbLSSZQPU'
                      }}
                    />
                  </div>
                </section>
              </div>

              <h3 className='text-xl md:text-2xl font-semibold text-gray-sipan mb-4 font-frances'>
                Corrección Inteligente
              </h3>
              <p className='text-gray-600 text-center font-exo'>
                SipánGPT entiende y corrige tus preguntas para darte la
                información correcta sobre la universidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

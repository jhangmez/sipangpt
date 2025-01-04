'use client'
import React from 'react'
import { LiteYoutubeEmbed } from 'react-lite-yt-embed'

export default function Feedback() {
  return (
    <section className='py-16 md:py-24 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <h2 className='text-3xl md:text-4xl font-bold text-center text-gray-sipan mb-12 font-frances'>
          Ayúdanos a Mejorar: Envía tu Feedback
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
          {/* Video Explicativo */}
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
                id='L54kj8e81to'
                desktopResolution='hqdefault'
                iframeTitle='SipánGPT - Cómo enviar feedback'
                defaultPlay
                mute
                noCookie
                params={{
                  rel: '0',
                  modestbranding: '1',
                  showinfo: '0',
                  controls: '0',
                  autoplay: '1',
                  loop: '1'
                }}
              />
            </div>
          </section>

          {/* Texto Descriptivo */}
          <div className='flex flex-col items-center md:items-start'>
            <p className='text-gray-sipan text-center md:text-left mb-6 font-exo'>
              Después de cada respuesta de SipánGPT, encontrarás dos botones:
              uno para <strong className='text-error'>feedback negativo</strong>{' '}
              y otro para{' '}
              <strong className='text-green-500'>feedback positivo</strong>.
            </p>
            <p className='text-gray-sipan text-center md:text-left mb-6 font-exo'>
              Al hacer clic en cualquiera de estos botones, se abrirá una
              ventana donde podrás calificar la respuesta con{' '}
              <strong className='text-gray-sipan'>1 a 5 estrellas</strong> y, si
              lo deseas, dejar un{' '}
              <strong className='text-gray-sipan'>mensaje opcional</strong>{' '}
              explicando tu calificación.
            </p>
            <p className='text-gray-sipan text-center md:text-left font-exo'>
              Tu feedback es crucial para que podamos identificar áreas de
              mejora y hacer que SipánGPT sea aún más preciso y útil para todos.
              ¡Gracias por ayudarnos a crecer!
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

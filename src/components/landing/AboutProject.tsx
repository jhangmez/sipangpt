import Link from 'next/link'
import React from 'react'

export default function AboutProject() {
  return (
    <section className='py-16 md:py-24 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <h2 className='text-3xl md:text-4xl font-bold text-center text-gray-sipan mb-12 font-frances'>
          Acerca del Proyecto SipánGPT
        </h2>
        <div className='max-w-3xl mx-auto'>
          {' '}
          {/* Reducido el ancho máximo */}
          <p className='text-gray-600 mb-8 text-lg font-exo'>
            {' '}
            {/* Aumentado el tamaño del texto y el margen inferior */}
            SipánGPT es un proyecto de tesis desarrollado con el objetivo de
            revolucionar la forma en que los estudiantes de la Universidad Señor
            de Sipán acceden a la información.
          </p>
          {/* Contenedor para cada sección de información */}
          <div className='mb-10'>
            <h3 className='text-2xl font-semibold text-gray-sipan mb-4 font-frances text-center'>
              Tecnología
            </h3>
            <p className='text-gray-600 mb-6 text-lg font-exo'>
              {' '}
              {/* Aumentado el tamaño del texto */}
              Este chatbot se basa en el modelo de lenguaje Llama 3.2, con 1
              billón de parámetros, conocido por su eficiencia y precisión. Ha
              sido ajustado con un dataset de 304,000 conversaciones generadas
              para garantizar respuestas relevantes.{' '}
              <Link
                href='https://huggingface.co/datasets/ussipan/sipangpt'
                className='text-green-500 font-semibold'
                target='_blank'
                rel='noopener noreferrer'
              >
                Ir al dataset
              </Link>
            </p>
          </div>
          <div className='mb-10'>
            <h3 className='text-2xl font-semibold text-gray-sipan mb-4 font-frances text-center'>
              Arquitectura
            </h3>
            <p className='text-gray-600 mb-6 text-lg font-exo'>
              {/* Aumentado el tamaño del texto */}
              SipánGPT utiliza una arquitectura Transformer, una de las más
              avanzadas en el campo del procesamiento del lenguaje natural.
            </p>
          </div>
          <div className='mb-10'>
            <h3 className='text-2xl font-semibold text-gray-sipan mb-4 font-frances text-center'>
              Disponibilidad
            </h3>
            <p className='text-gray-600 mb-6 text-lg font-exo'>
              {/* Aumentado el tamaño del texto */}
              Debido a limitaciones computacionales, SipánGPT está disponible de
              8:00 a.m. a 8:00 p.m.
            </p>
          </div>
          <div>
            <h3 className='text-2xl font-semibold text-gray-sipan mb-4 font-frances text-center'>
              Visión
            </h3>
            <p className='text-gray-600 text-lg font-exo'>
              {' '}
              {/* Aumentado el tamaño del texto */}
              Nuestra visión es que SipánGPT se convierta en una herramienta
              para la comunidad universitaria, facilitando el acceso a la
              información y mejorando la experiencia de los estudiantes.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

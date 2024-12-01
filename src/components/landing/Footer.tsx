import React from 'react'
import { FaGithub, FaLinkedin } from 'react-icons/fa'
import { SiHuggingface } from 'react-icons/si'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className='bg-gray-sipan py-4'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col sm:flex-row justify-between items-center font-exo text-sm text-gray-100'>
          <p>2024 Jhan Gómez P.</p>
          <p className='my-2 sm:my-0'>
            <Link href='/terms#condiciones' className='hover:underline'>
              Términos de uso
            </Link>{' '}
            &bull;{' '}
            <Link href='/terms#politica' className='hover:underline'>
              Política de privacidad
            </Link>
          </p>
          <div className='flex space-x-4'>
            <Link
              href='https://github.com/jhangmez'
              target='_blank'
              aria-label='GitHub'
            >
              <FaGithub className='text-xl hover:text-gray-800' />
            </Link>
            <Link
              href='https://www.linkedin.com/in/jhangmez'
              target='_blank'
              aria-label='LinkedIn'
            >
              <FaLinkedin className='text-xl hover:text-blue-600' />
            </Link>
            <Link
              href='https://huggingface.co/jhangmez'
              target='_blank'
              aria-label='Hugging Face'
            >
              <SiHuggingface className='text-xl hover:text-yellow-500' />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

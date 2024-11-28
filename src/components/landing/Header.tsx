import React from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'

export default function Header() {
  return (
    <header className='bg-primary shadow-sm'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center py-4'>
          <Link
            href={'/'}
            className='text-2xl font-bold font-frances text-gray-sipan  flex items-center gap-1.5'
          >
            SipánGPT{' '}
            <span className='font-exo rounded-xl select-none font-xs px-1.5 py-0.5 text-xs uppercase text-yellow-800 font-bold bg-yellow-500'>
              Beta
            </span>
          </Link>

          <Button
            variant='outline'
            className='font-exo bg-gray-100 dark:bg-gray-sipan font-semibold'
            asChild
          >
            <Link href='/login'>Ingresar</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

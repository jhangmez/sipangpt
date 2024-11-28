import React from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'

export default function Header() {
  return (
    <header className='bg-primary shadow-sm'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center py-4'>
          <h1 className='text-2xl font-bold font-frances dark:text-background'>
            SipánGPT
          </h1>

          <Button variant='outline' className='font-exo bg-gray-sipan' asChild>
            <Link href='/login'>Ingresar</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

import React from 'react'
import { Button } from '@nextui-org/react'
import { Image } from '@nextui-org/react'
import ussLogo from '../../../../public/uss_logo.webp'
import { AvatarDropdownMenu } from '@Components/(private)/DropdownMenu'

export default function Sidebar() {
  return (
    <aside className='flex h-screen lg:w-2/12 md:w-4/12 w-1/12 flex-col border-r border-gray-200 lg:flex md:flex hidden'>
      <div className='flex-1 overflow-auto'>
        <div className='flex mx-2 mb-6 mt-2 gap-2 items-center'>
          <Image
            src='/uss_logo.webp'
            radius='none'
            alt='USS Logo'
            width={ussLogo.width / 18}
            className='dark:invert'
          />
          <h1 className='text-2xl font-bold text-primary font-frances'>
            SipánGPT
          </h1>
        </div>
        <nav className='flex-1 font-exo'>
          <ul>
            <li>
              <Button
                variant='light'
                className='w-full justify-start font-semibold dark:text-gray-100 hover:text-secondary dark:hover:text-secondary text-lg'
              >
                Nuevo chat
              </Button>
            </li>
            <li>
              <Button
                variant='light'
                className='w-full justify-start font-semibold dark:text-gray-100 hover:text-secondary dark:hover:text-secondary text-lg'
              >
                Historial
              </Button>
            </li>
            <li>
              <Button
                variant='light'
                className='w-full justify-start font-semibold dark:text-gray-100 hover:text-secondary dark:hover:text-secondary text-lg'
              >
                Configuraciones
              </Button>
            </li>
          </ul>
        </nav>
      </div>
      <div className='flex gap-2 p-4'>
        <AvatarDropdownMenu
          src='https://github.com/jhangmez.png'
          alt='jhangmez'
          fallbackText='Jhan'
        />
        <Button className='mt-auto text-onPrimary bg-primary dark:text-onPrimary dark:bg-primary font-frances font-bold'>
          Salir
        </Button>
      </div>
    </aside>
  )
}

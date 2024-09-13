import React from 'react'
import { Image } from '@nextui-org/react'
import ussLogo from '../../../../public/uss_logo.webp'
import { AvatarDropdownMenu } from '@Components/(private)/DropdownMenu'
import { HeaderDropdownMenu } from '@Components/(private)/DropdownMenu'

export default function Header() {
  return (
    <header className='sm:hidden p-4 flex justify-between items-center'>
      <h1 className='flex items-center'>
        <Image
          src='/uss_logo.webp'
          radius='none'
          alt='USS Logo'
          width={ussLogo.width / 18}
          className='dark:invert'
        />
        <HeaderDropdownMenu />
      </h1>

      <AvatarDropdownMenu
        src='https://github.com/jhangmez.png'
        alt='jhangmez'
        fallbackText='Jhan'
      />
    </header>
  )
}

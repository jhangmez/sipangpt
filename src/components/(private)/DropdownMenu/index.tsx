'use client'

import { Button } from '@nextui-org/react'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/dropdown'
import { Avatar } from '@nextui-org/avatar'

export const HeaderDropdownMenu = () => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          endContent={
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
            >
              <path
                fill='currentColor'
                d='m12 13.171l4.95-4.95l1.414 1.415L12 16L5.636 9.636L7.05 8.222z'
              />
            </svg>
          }
          variant='light'
          className='text-xl font-bold text-primary font-frances px-2'
        >
          SipánGPT
        </Button>
      </DropdownTrigger>
      <DropdownMenu>
        <DropdownItem>Nuevo chat</DropdownItem>
        <DropdownItem>Historial</DropdownItem>
        <DropdownItem>Configuraciones</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

export const AvatarDropdownMenu = ({
  src,
  alt,
  fallbackText
}: {
  src: string
  alt: string
  fallbackText: string
}) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Avatar isBordered src={src} alt={alt} name={fallbackText} />
      </DropdownTrigger>
      <DropdownMenu>
        <DropdownItem color='secondary'>Perfil</DropdownItem>
        <DropdownItem color='danger'>Cerrar sesión</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

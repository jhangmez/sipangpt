'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { GearIcon, StarIcon } from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'
import { Skeleton } from './ui/skeleton'
import EditUsernameForm from './edit-username-form'

export default function UserSettings() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleStorageChange = () => {
      const username = localStorage.getItem('ollama_user')
      if (username) {
        setName(username)
        setIsLoading(false)
      }
    }

    const fetchData = () => {
      const username = localStorage.getItem('ollama_user')
      if (username) {
        setName(username)
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchData()

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex justify-start gap-3 w-full h-14 text-base font-normal items-center '
        >
          <Avatar className='flex justify-start items-center overflow-hidden'>
            <AvatarImage
              src=''
              alt='AI'
              width={4}
              height={4}
              className='object-contain'
            />
            <AvatarFallback>
              {name && name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='text-xs truncate font-exo font-medium'>
            {isLoading ? (
              <Skeleton className='w-20 h-4' />
            ) : (
              name || 'Anonymous'
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-48 p-2'>
        <Dialog>
          <DialogTrigger className='w-full'>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className='flex w-full gap-2 p-1 items-center cursor-pointer font-exo'>
                <GearIcon className='w-4 h-4' />
                Configuraciones
              </div>
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className='space-y-4 font-exo'>
              <DialogTitle>Configuraciones</DialogTitle>
              <EditUsernameForm setOpen={setOpen} />
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger className='w-full'>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className='flex w-full gap-2 p-1 items-center cursor-pointer font-exo'>
                <StarIcon className='w-4 h-4' />
                Créditos
              </div>
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className='space-y-4 font-exo'>
              <DialogTitle>Créditos</DialogTitle>
              <div className='pl-2'>
                <Link
                  href='https://www.linkedin.com/in/jhangmez/'
                  className='underline hover:text-sky-500'
                >
                  @jhangmez
                </Link>
                <br></br>
                <Link
                  href='https://www.uss.edu.pe/uss/'
                  className='underline hover:text-sky-500'
                >
                  Universidad Señor de Sipán
                </Link>
                <br></br>
                <Link
                  href='https://github.com/jakobhoeg'
                  className='underline hover:text-sky-500'
                >
                  @jakobhoeg
                </Link>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Dialog></Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

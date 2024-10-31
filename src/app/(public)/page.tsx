'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import UsernameForm from '@/components/username-form'
import { ChatContainer } from '@/components/chat/chat-container'

export default function Home() {
  const [open, setOpen] = useState(true) // Inicialmente true
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Verificar localStorage después de que el componente se monte
    const hasUser = localStorage.getItem('ollama_user')
    if (hasUser) {
      setOpen(false)
    }
  }, [])

  // No renderizar nada hasta que el componente esté montado
  if (!mounted) {
    return null
  }

  const onOpenChange = (isOpen: boolean) => {
    const username = localStorage.getItem('ollama_user')
    if (username) return setOpen(isOpen)

    localStorage.setItem('ollama_user', 'Anonymous')
    window.dispatchEvent(new Event('storage'))
    setOpen(isOpen)
  }

  return (
    <main className='flex h-[calc(100dvh)] flex-col items-center'>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <ChatContainer />
        <DialogContent className='flex flex-col space-y-4 font-exo'>
          <DialogHeader className='space-y-2'>
            <DialogTitle>
              Bienvenido a{' '}
              <span className='font-frances text-primary'>SipánGPT</span>
            </DialogTitle>
            <DialogDescription>
              Escribe tu nombre para comenzar. Esto es sólo para personalizar tu
              experiencia.
            </DialogDescription>
            <UsernameForm setOpen={setOpen} />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  )
}

'use client'

import React, { useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '../ui/button'
import { CaretSortIcon, HamburgerMenuIcon } from '@radix-ui/react-icons'
import { Sidebar } from '../sidebar'
import { Message } from 'ai/react'
import { getSelectedModel } from '@/lib/model-helper'

interface ChatTopbarProps {
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>
  isLoading: boolean
  chatId?: string
  messages: Message[]
  setMessages: (messages: Message[]) => void
}

export default function ChatTopbar({
  setSelectedModel,
  isLoading,
  chatId,
  messages,
  setMessages
}: ChatTopbarProps) {
  const [models, setModels] = React.useState<string[]>([])
  const [open, setOpen] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [currentModel, setCurrentModel] = React.useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = React.useState<
    'loading' | 'ok' | 'error'
  >('loading')

  useEffect(() => {
    setCurrentModel(getSelectedModel())

    const env = process.env.NODE_ENV

    const fetchModels = async () => {
      setConnectionStatus('loading')
      try {
        if (env === 'production') {
          const fetchedModels = await fetch(
            process.env.NEXT_PUBLIC_OLLAMA_URL + '/api/tags'
          )

          if (!fetchedModels.ok) {
            console.error('Error en la respuesta:', fetchedModels.status)
            setConnectionStatus('error')
            setModels([])
            return
          }

          const responseText = await fetchedModels.text()
          // console.log('Respuesta raw:', responseText)

          // Verificar que la respuesta no esté vacía
          if (!responseText) {
            console.error('Respuesta vacía del servidor')
            setModels([])
            setConnectionStatus('error')
            return
          }

          try {
            const json = JSON.parse(responseText)
            if (json && json.models) {
              const apiModels = json.models.map((model: any) => model.name)
              setModels([...apiModels])
              setConnectionStatus('ok')
            } else {
              console.error('Formato de respuesta inválido:', json)
              setModels([])
              setConnectionStatus('error')
            }
          } catch (parseError) {
            console.error('Error al parsear JSON:', parseError)
            setModels([])
            setConnectionStatus('error')
          }
        } else {
          const fetchedModels = await fetch('/api/tags')

          if (!fetchedModels.ok) {
            console.error('Error en la respuesta:', fetchedModels.status)
            setModels([])
            setConnectionStatus('error')
            return
          }

          const responseText = await fetchedModels.text()
          // console.log('Respuesta raw:', responseText)

          try {
            const json = JSON.parse(responseText)
            if (json && json.models) {
              const apiModels = json.models.map((model: any) => model.name)
              setModels([...apiModels])
              setConnectionStatus('ok')
            } else {
              console.error('Formato de respuesta inválido:', json)
              setConnectionStatus('error')
              setModels([])
            }
          } catch (parseError) {
            console.error('Error al parsear JSON:', parseError)
            setModels([])
            setConnectionStatus('error')
          }
        }
      } catch (error) {
        console.error('Error al obtener los modelos:', error)
        setModels([])
        setConnectionStatus('error')
      }
    }
    fetchModels()
  }, [])

  const handleModelChange = (model: string) => {
    setCurrentModel(model)
    setSelectedModel(model)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedModel', model)
    }
    setOpen(false)
  }

  const handleCloseSidebar = () => {
    setSheetOpen(false) // Close the sidebar
  }

  const getDisplayName = (model: string) => {
    const match = model.match(/SipanGPT-(.*?)-Llama/)
    return match ? `SipánGPT-${match[1]}` : model
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'loading':
        return <Badge variant='outline'>Cargando</Badge>
      case 'error':
        return <Badge variant='destructive'>Desactivado</Badge>
      case 'ok':
        return <Badge variant='default'>Conectado</Badge>
    }
  }

  return (
    <div className='w-full flex px-4 py-6  items-center justify-between lg:justify-center '>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger>
          <HamburgerMenuIcon className='lg:hidden w-5 h-5' />
        </SheetTrigger>
        <SheetContent side='left'>
          <Sidebar
            chatId={chatId || ''}
            isCollapsed={false}
            isMobile={false}
            messages={messages}
            setMessages={setMessages}
            closeSidebar={handleCloseSidebar}
          />
        </SheetContent>
      </Sheet>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant='outline'
            aria-label='Botón para seleccionar el modelo de SipánGPT'
            role='combobox'
            aria-expanded={open}
            className='w-[300px] justify-between font-exo'
          >
            <span className='flex w-full justify-between'>
              {getDisplayName(currentModel || 'Escoge el modelo')}
              {getStatusBadge()}
            </span>
            <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-1'>
          {models.length > 0 ? (
            models.map((model) => (
              <Button
                key={model}
                variant='ghost'
                className='w-full'
                onClick={() => {
                  handleModelChange(model)
                }}
              >
                {getDisplayName(model)}
              </Button>
            ))
          ) : (
            <Button variant='ghost' disabled className='font-exo w-full'>
              No hay más modelos disponibles
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

'use client'

import React, { useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '../ui/button'
import {
  CaretSortIcon,
  HamburgerMenuIcon,
  CheckIcon
} from '@radix-ui/react-icons'
import { Sidebar } from '../sidebar'
import { Message } from 'ai/react'
import { getSelectedModel } from '@/lib/model-helper'
import { getModelInfo } from '@/lib/utils'

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
    setSheetOpen(false)
  }

  const getDisplayName = (model: string) => {
    const match = model.match(/SipanGPT-(.*?)-Llama/)
    return match ? `SipánGPT-${match[1]}` : model
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'loading':
        return (
          <Badge variant='outline' className='select-none'>
            Cargando
          </Badge>
        )
      case 'error':
        return (
          <Badge variant='destructive' className='select-none'>
            Desconectado
          </Badge>
        )
      case 'ok':
        return (
          <Badge variant='default' className='select-none'>
            Conectado
          </Badge>
        )
    }
  }

  return (
    <div className='w-full flex px-4 py-6 items-center justify-between lg:justify-center '>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger>
          <HamburgerMenuIcon
            aria-label='Boton para abrir el dropdown'
            className='lg:hidden w-5 h-5'
          />
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
        <PopoverContent className='lg:w-[500px] md:w-[300px] w-full p-1'>
          {models.length > 0 ? (
            models.map((model) => {
              const modelInfo = getModelInfo(model)
              const isSelected = currentModel === model

              return (
                <Button
                  key={model}
                  variant='ghost'
                  className='w-full h-auto py-4 px-4'
                  onClick={() => handleModelChange(model)}
                >
                  <div className='flex w-full items-start justify-between gap-2'>
                    <div className='flex flex-col items-start text-left space-y-1 max-w-[80%]'>
                      <div className='flex gap-1 items-center'>
                        <p className='font-semibold font-exo flex flex-wrap items-center gap-1'>
                          {modelInfo.nombre_comercial}
                        </p>
                        <p className='text-xs text-muted-foreground font-frances italic inline-block overflow-hidden text-ellipsis max-w-[150px] sm:max-w-[200px] md:max-w-[150px] lg:max-w-[300px]'>
                          &#40;{modelInfo.nombre_original_modelo} &#41;
                        </p>
                      </div>
                      <div className='w-full'>
                        <p className='text-sm font-exo text-muted-foreground line-clamp-3 inline-block overflow-hidden text-ellipsis max-w-[150px] sm:max-w-[200px] lg:max-w-full lg:max-w-full'>
                          {modelInfo.descripcion}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 ml-auto'>
                      {isSelected && (
                        <CheckIcon className='h-4 w-4 text-green-500 flex-shrink-0' />
                      )}
                    </div>
                  </div>
                </Button>
              )
            })
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

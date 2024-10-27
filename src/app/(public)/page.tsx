'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Attachment, ChatRequestOptions } from 'ai'
import { Message, useChat } from 'ai/react'
import { ChatOllama } from '@langchain/ollama'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { BytesOutputParser } from '@langchain/core/output_parsers'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogContent
} from '@/components/ui/dialog'
import useChatStore from '../hooks/useChatStore'
import { toast } from 'sonner'
import { getSelectedModel } from '@/lib/model-helper'
import { v4 as uuidv4 } from 'uuid'
import UsernameForm from '@/components/username-form'
import { ChatLayout } from '@/components/chat/chat-layout'

export default function Home() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    data,
    stop,
    setMessages,
    setInput
  } = useChat({
    onResponse: (response) => {
      if (response) {
        setLoadingSubmit(false)
      }
    },
    onError: (error) => {
      setLoadingSubmit(false)
      toast.error('Ha ocurrido un error. Por favor, intente de nuevo.')
    }
  })
  const [chatId, setChatId] = React.useState<string>('')
  const [selectedModel, setSelectedModel] = React.useState<string>(
    getSelectedModel()
  )
  const [open, setOpen] = React.useState(false)
  const [ollama, setOllama] = useState<ChatOllama>()
  const env = process.env.NODE_ENV
  const [loadingSubmit, setLoadingSubmit] = React.useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (messages.length < 1) {
      // console.log('Generando id del chat')
      const id = uuidv4()
      setChatId(id)
    }
  }, [messages.length]) // Cambiado para usar messages.length en lugar de messages

  useEffect(() => {
    if (!isLoading && !error && chatId && messages.length > 0) {
      // Save messages to local storage
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages))
      // Trigger the storage event to update the sidebar component
      window.dispatchEvent(new Event('storage'))
    }
  }, [chatId, isLoading, error, messages]) // Añadido messages como dependencia

  useEffect(() => {
    if (env === 'production') {
      const newOllama = new ChatOllama({
        baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434',
        model: selectedModel
      })
      setOllama(newOllama)
    }

    if (!localStorage.getItem('ollama_user')) {
      setOpen(true)
    }
  }, [selectedModel, env]) // Añadido env como dependencia

  const addMessage = (Message: Message) => {
    messages.push(Message)
    window.dispatchEvent(new Event('storage'))
    setMessages([...messages])
  }

  // Function to handle chatting with Ollama in production (client side)
  const handleSubmitProduction = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    addMessage({ role: 'user', content: input, id: chatId })
    setInput('')

    if (ollama) {
      try {
        const parser = new BytesOutputParser()

        const stream = await ollama
          .pipe(parser)
          .stream(
            (messages as Message[]).map((m) =>
              m.role == 'user'
                ? new HumanMessage(m.content)
                : new AIMessage(m.content)
            )
          )

        const decoder = new TextDecoder()

        let responseMessage = ''
        for await (const chunk of stream) {
          const decodedChunk = decoder.decode(chunk)
          responseMessage += decodedChunk
          setLoadingSubmit(false)
          setMessages([
            ...messages,
            { role: 'assistant', content: responseMessage, id: chatId }
          ])
        }
        addMessage({ role: 'assistant', content: responseMessage, id: chatId })
        setMessages([...messages])

        localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages))
        // Trigger the storage event to update the sidebar component
        window.dispatchEvent(new Event('storage'))
      } catch (error) {
        toast.error('Ha ocurrido un error. Por favor, intente de nuevo.')
        setLoadingSubmit(false)
      }
    }
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoadingSubmit(true)

    setMessages([...messages])

    // Prepare the options object with additional body data, to pass the model.
    const requestOptions: ChatRequestOptions = {
      options: {
        body: {
          selectedModel: selectedModel
        }
      }
    }

    messages.slice(0, -1)

    if (env === 'production') {
      handleSubmitProduction(e)
    } else {
      // Call the handleSubmit function with the options
      handleSubmit(e, requestOptions)
    }
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
        <ChatLayout
          chatId=''
          setSelectedModel={setSelectedModel}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={onSubmit}
          isLoading={isLoading}
          loadingSubmit={loadingSubmit}
          error={error}
          stop={stop}
          navCollapsedSize={10}
          defaultLayout={[30, 160]}
          formRef={formRef}
          setMessages={setMessages}
          setInput={setInput}
        />
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

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChatRequestOptions } from 'ai'
import { Message, useChat } from 'ai/react'
import { ChatOllama } from '@langchain/ollama'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { BytesOutputParser } from '@langchain/core/output_parsers'
import { toast } from 'sonner'
import { getSelectedModel } from '@/lib/model-helper'
import { v4 as uuidv4 } from 'uuid'
import { ChatLayout } from './chat-layout'

interface ChatContainerProps {
  initialChatId?: string
  showWelcomeDialog?: boolean
}

export function ChatContainer({
  initialChatId,
  showWelcomeDialog = false
}: ChatContainerProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
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
      toast.error(`Ha ocurrido un error:${error}`)
    },
    experimental_throttle: 100
  })

  const [chatId, setChatId] = useState<string>(initialChatId || '')
  const [selectedModel, setSelectedModel] = useState<string>(getSelectedModel())
  const [ollama, setOllama] = useState<ChatOllama>()
  const env = process.env.NODE_ENV
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [mounted, setMounted] = useState(false)

  // Initialize chat ID for new chats
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize chat ID for new chats
  useEffect(() => {
    if (!initialChatId && messages.length < 1) {
      const id = uuidv4()
      setChatId(id)
    }
  }, [initialChatId, messages.length])

  // Load existing chat
  useEffect(() => {
    if (mounted && initialChatId) {
      const item = localStorage.getItem(`chat_${initialChatId}`)
      if (item) {
        setMessages(JSON.parse(item))
      }
    }
  }, [initialChatId, setMessages, mounted])

  // Initialize Ollama in production
  useEffect(() => {
    if (env === 'production') {
      const newOllama = new ChatOllama({
        baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434',
        model: selectedModel
      })
      setOllama(newOllama)
    }
  }, [selectedModel, env])

  // Save messages to localStorage
  useEffect(() => {
    if (mounted && !isLoading && !error && messages.length > 0 && chatId) {
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages))
      window.dispatchEvent(new Event('storage'))
    }
  }, [messages, chatId, isLoading, error, mounted])

  // No renderizar nada hasta que el componente esté montado
  if (!mounted) {
    return null
  }

  const addMessage = (message: Message) => {
    messages.push(message)
    window.dispatchEvent(new Event('storage'))
    setMessages([...messages])
  }

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
      handleSubmit(e, requestOptions)
    }
  }

  return (
    <ChatLayout
      chatId={chatId}
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
  )
}

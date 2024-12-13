import { Message } from 'ai/react'
import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Avatar, AvatarImage } from '../ui/avatar'
import { ChatProps } from './chat'
import Image from 'next/image'
import { INITIAL_QUESTIONS } from '@/utils/initial-questions'
import { Button } from '../ui/button'
import ChatMessage from './chat-message'

export default function ChatList({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  stop,
  loadingSubmit,
  formRef,
  isMobile
}: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [name, setName] = React.useState<string>('')
  const [localStorageIsLoading, setLocalStorageIsLoading] = React.useState(true)
  const [initialQuestions, setInitialQuestions] = React.useState<Message[]>([])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const username = localStorage.getItem('ollama_user')
    if (username) {
      setName(username)
      setLocalStorageIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const fetchPreguntas = async () => {
      try {
        const response = await fetch('/api/preguntas')
        if (response.ok) {
          const preguntas = await response.json()
          const questionCount = isMobile ? 2 : 4
          setInitialQuestions(
            preguntas
              .sort(() => Math.random() - 0.5)
              .slice(0, questionCount)
              .map((pregunta: any) => ({
                id: pregunta.id.toString(),
                role: 'user',
                content: pregunta.contenido
              }))
          )
        } else {
          console.error('Error al obtener las preguntas')
        }
      } catch (error) {
        console.error('Error al obtener las preguntas:', error)
      }
    }

    if (messages.length === 0) {
      fetchPreguntas()
    }
  }, [isMobile, messages.length])

  const onClickQuestion = (value: string, e: React.MouseEvent) => {
    e.preventDefault()

    handleInputChange({
      target: { value }
    } as React.ChangeEvent<HTMLTextAreaElement>)

    setTimeout(() => {
      formRef.current?.dispatchEvent(
        new Event('submit', {
          cancelable: true,
          bubbles: true
        })
      )
    }, 1)
  }

  if (messages.length === 0) {
    return (
      <div className='w-full h-full flex justify-center items-center'>
        <div className='relative flex flex-col gap-4 items-center justify-center w-full h-full'>
          <div className='flex flex-col gap-4 items-center'>
            <div className='flex mx-2 mb-6 mt-2 gap-2 items-center opacity-50'>
              <Image
                src='/uss_logo.webp'
                alt='AI'
                width={60}
                height={60}
                className='h-20 w-14 object-contain dark:invert select-none'
              />
              <h1 className='text-2xl font-bold text-primary font-frances select-none'>
                SipánGPT
              </h1>
              <span className='font-exo rounded-xl select-none font-xs px-1.5 py-0.5 text-xs uppercase text-yellow-800 font-bold bg-yellow-500'>
                Beta
              </span>
            </div>
            <p className='text-center text-lg text-muted-foreground font-exo font-medium'>
              ¿Cómo puedo ayudarte?
            </p>
          </div>

          <div className='absolute bottom-0 w-full px-4 sm:max-w-3xl grid gap-2 sm:grid-cols-2 sm:gap-4 text-sm font-exo'>
            {/* Only display 4 random questions */}
            {initialQuestions.length > 0 &&
              initialQuestions.map((message) => {
                const delay = Math.random() * 0.25

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 1, y: 10, x: 0 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 1, y: 10, x: 0 }}
                    transition={{
                      opacity: { duration: 0.1, delay },
                      scale: { duration: 0.1, delay },
                      y: { type: 'spring', stiffness: 100, damping: 10, delay }
                    }}
                    key={message.content}
                  >
                    <Button
                      key={message.content}
                      type='button'
                      variant='outline'
                      className='sm:text-start px-4 py-8 flex w-full justify-center sm:justify-start items-center text-sm whitespace-pre-wrap'
                      onClick={(e) => onClickQuestion(message.content, e)}
                    >
                      {message.content}
                    </Button>
                  </motion.div>
                )
              })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      id='scroller'
      className='w-full overflow-y-scroll overflow-x-hidden h-full justify-end'
    >
      <div className='w-full flex flex-col overflow-x-hidden overflow-y-hidden min-h-full justify-end'>
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            message={message}
            index={index}
            isLast={index === messages.length - 1}
            isLoading={isLoading}
            name={name}
            messagesLength={messages.length}
            messages={messages}
          />
        ))}
        {loadingSubmit && (
          <div className='flex pl-4 pb-4 gap-2 items-center'>
            <Avatar className='flex justify-start items-center'>
              <AvatarImage
                src='/uss_logo.webp'
                alt='SipánGPT'
                width={6}
                height={6}
                className='object-contain dark:invert'
              />
            </Avatar>
            <div className='bg-accent p-3 rounded-md max-w-xs sm:max-w-2xl overflow-x-auto'>
              <div className='flex gap-1'>
                <span className='size-1.5 rounded-full bg-slate-700 motion-safe:animate-[bounce_1s_ease-in-out_infinite] dark:bg-slate-300'></span>
                <span className='size-1.5 rounded-full bg-slate-700 motion-safe:animate-[bounce_0.5s_ease-in-out_infinite] dark:bg-slate-300'></span>
                <span className='size-1.5 rounded-full bg-slate-700 motion-safe:animate-[bounce_1s_ease-in-out_infinite] dark:bg-slate-300'></span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div id='anchor' ref={bottomRef}></div>
    </div>
  )
}

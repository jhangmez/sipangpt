'use client'

import React, { useEffect } from 'react'
import { ChatProps } from './chat'
import { Button } from '../ui/button'
import TextareaAutosize from 'react-textarea-autosize'
import { AnimatePresence, motion } from 'framer-motion'
import { StopIcon } from '@radix-ui/react-icons'
import { SendHorizonal } from 'lucide-react'

export default function ChatBottombar({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  stop,
  formRef,
  setInput
}: ChatProps) {
  const [message, setMessage] = React.useState(input)
  const [isMobile, setIsMobile] = React.useState(false)
  const [showLimitError, setShowLimitError] = React.useState(false)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const env = process.env.NODE_ENV
  const CHARACTER_LIMIT = 200

  React.useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    // Initial check
    checkScreenWidth()

    // Event listener for screen width changes
    window.addEventListener('resize', checkScreenWidth)

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('resize', checkScreenWidth)
    }
  }, [])

  // Update error message visibility based on input length
  React.useEffect(() => {
    setShowLimitError(input.length > CHARACTER_LIMIT)
  }, [input])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <div className='p-4 pb-7 flex justify-between w-full items-center gap-2'>
      <AnimatePresence initial={false}>
        <div className='w-full items-center flex relative gap-2 flex-col'>
          <div className='flex flex-col relative w-full bg-accent dark:bg-card rounded-lg'>
            <div className='flex w-full'>
              <form
                onSubmit={handleSubmit}
                className='w-full items-center flex relative gap-2'
              >
                <TextareaAutosize
                  autoComplete='off'
                  value={input}
                  ref={inputRef}
                  onKeyDown={handleKeyPress}
                  onChange={handleInputChange}
                  name='message'
                  placeholder='Escribe tu pregunta aquí.'
                  className=' max-h-24 px-8 bg-accent py-[22px] rounded-lg font-exo font-medium text-sm placeholder:text-muted-foreground border focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full flex items-center h-16 resize-none overflow-hidden dark:bg-card'
                />
                {!isLoading ? (
                  <div className='flex absolute right-3 items-center'>
                    <Button
                      className='shrink-0 rounded-full'
                      variant='ghost'
                      size='icon'
                      aria-label='Botón para enviar pregunta'
                      type='submit'
                      disabled={
                        isLoading ||
                        !input.trim() ||
                        input.length > CHARACTER_LIMIT
                      }
                    >
                      <SendHorizonal className='w-5 h-5 ' />
                    </Button>
                  </div>
                ) : (
                  <div className='flex absolute right-3 items-center'>
                    <Button
                      className='shrink-0 rounded-full'
                      variant='ghost'
                      size='icon'
                      type='submit'
                      onClick={(e) => {
                        e.preventDefault()
                        stop()
                      }}
                    >
                      <StopIcon className='w-5 h-5  ' />
                    </Button>
                  </div>
                )}
              </form>
            </div>
            {showLimitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className='absolute select-none font-exo -top-6 left-0 text-sm text-red-500 font-medium'
              >
                Se admiten máximo {CHARACTER_LIMIT} caracteres
              </motion.div>
            )}
          </div>
          <p className='text-[12px] lg:text-xs font-exo text-center select-none'>
            <span className='font-frances text-primary transition-all duration-300 hover:animate-[wave_2s_linear_infinite] hover:text-transparent hover:bg-gradient-to-r hover:from-primary hover:via-primary/40 hover:to-primary hover:bg-[length:200%_100%] hover:bg-clip-text'>
              SipánGPT
            </span>{' '}
            es un chatbot experimental y puede cometer errores. Considera
            verificar la información mostrada.
          </p>
        </div>
      </AnimatePresence>
    </div>
  )
}

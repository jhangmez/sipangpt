'use client'

import React, { useEffect } from 'react'
import { ChatProps } from './chat'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '../ui/button'
import TextareaAutosize from 'react-textarea-autosize'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cross2Icon,
  ImageIcon,
  PaperPlaneIcon,
  StopIcon
} from '@radix-ui/react-icons'
import { Mic, SendHorizonal } from 'lucide-react'
import useChatStore from '@/app/hooks/useChatStore'
import Image from 'next/image'

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
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const env = process.env.NODE_ENV

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
        <div className='w-full items-center flex relative gap-2'>
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
                  placeholder='Enter your prompt here'
                  className=' max-h-24 px-14 bg-accent py-[22px] rounded-lg  text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full flex items-center h-16 resize-none overflow-hidden dark:bg-card'
                />

                {!isLoading ? (
                  <div className='flex absolute right-3 items-center'>
                    <Button
                      className='shrink-0 rounded-full'
                      variant='ghost'
                      size='icon'
                      type='submit'
                      disabled={isLoading || !input.trim()}
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
                      type='button'
                      disabled={true}
                    >
                      <Mic className='w-5 h-5 ' />
                    </Button>
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
          </div>
        </div>
      </AnimatePresence>
    </div>
  )
}

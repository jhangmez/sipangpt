// components/chat/chat-message.tsx
import React from 'react'
import { memo } from 'react'
import { Message } from 'ai'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import CodeDisplayBlock from '../code-display-block'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  CheckIcon,
  CopyIcon,
  ReloadIcon,
  CheckCircledIcon,
  CrossCircledIcon
} from '@radix-ui/react-icons'

interface ChatMessageProps {
  message: Message
  index: number
  isLast: boolean
  isLoading: boolean
  name: string
  messagesLength: number
}

function ChatMessage({
  message,
  index,
  isLast,
  isLoading,
  name,
  messagesLength
}: ChatMessageProps) {
  const [isCopied, setisCopied] = React.useState(false)
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content)
    setisCopied(true)
    toast.success('Código copiado al portapapeles!')
    setTimeout(() => {
      setisCopied(false)
    }, 1500)
  }
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 1, y: 20, x: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 1, y: 20, x: 0 }}
      transition={{
        opacity: { duration: 0.1 },
        layout: {
          type: 'spring',
          bounce: 0.3,
          duration: index * 0.05 + 0.2
        }
      }}
      className={cn(
        'flex flex-col gap-2 p-4 whitespace-pre-wrap',
        message.role === 'user' ? 'items-end' : 'items-start'
      )}
    >
      <div className='flex gap-3 items-center'>
        {message.role === 'user' && (
          <div className='flex items-end gap-3'>
            <div className='flex flex-col gap-2 bg-accent p-3 rounded-md max-w-xs sm:max-w-2xl overflow-x-auto font-exo'>
              <div className='flex gap-2'>
                {message.experimental_attachments
                  ?.filter((attachment) =>
                    attachment.contentType?.startsWith('image/')
                  )
                  .map((attachment, index) => (
                    <Image
                      key={`${message.id}-${index}`}
                      src={attachment.url}
                      width={200}
                      height={200}
                      alt='attached image'
                      className='rounded-md object-contain font-exo'
                    />
                  ))}
              </div>
              <p className='text-end'>{message.content}</p>
            </div>
            <Avatar className='flex justify-start items-center overflow-hidden'>
              <AvatarImage
                src='/'
                alt='user'
                width={6}
                height={6}
                className='object-contain'
              />
              <AvatarFallback>
                {name && name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        {message.role === 'assistant' && (
          <div className='flex items-start gap-2 '>
            <Avatar className='flex justify-start items-center'>
              <AvatarImage
                src='/uss_logo.webp'
                alt='AI'
                width={6}
                height={6}
                className='object-contain dark:invert'
              />
            </Avatar>
            <span className='bg-accent p-3 rounded-md max-w-xs sm:max-w-2xl overflow-x-auto font-exo'>
              {message.content.split('```').map((part, index) => {
                if (index % 2 === 0) {
                  return (
                    <Markdown key={index} remarkPlugins={[remarkGfm]}>
                      {part}
                    </Markdown>
                  )
                } else {
                  return (
                    <pre className='whitespace-pre-wrap' key={index}>
                      <CodeDisplayBlock code={part} lang='' />
                    </pre>
                  )
                }
              })}
              {isLoading && isLast && (
                <span className='animate-pulse' aria-label='Typing'>
                  ...
                </span>
              )}
              <Tooltip>
                <TooltipTrigger>
                  <Button variant='ghost' size='icon' className='self-end mt-2'>
                    <ReloadIcon className='w-2 h-2 scale-100 transition-all' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Regenerar</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant='ghost' size='icon' className='self-end mt-2'>
                    <CheckCircledIcon className='w-2 h-2 scale-100 transition-all' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Respuesta adecuada</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant='ghost' size='icon' className='self-end mt-2'>
                    <CrossCircledIcon className='w-2 h-2 scale-100 transition-all' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Respuesta inadecuada</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='self-end mt-2'
                    onClick={copyToClipboard}
                  >
                    {isCopied ? (
                      <CheckIcon className='w-2 h-2 scale-100 transition-all' />
                    ) : (
                      <CopyIcon className='w-2 h-2 scale-100 transition-all' />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copiar</p>
                </TooltipContent>
              </Tooltip>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default memo(ChatMessage, (prevProps, nextProps) => {
  return (
    !nextProps.isLast &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.message === nextProps.message &&
    prevProps.isLoading === nextProps.isLoading
  )
})

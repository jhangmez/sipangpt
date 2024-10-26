'use client'

import { useState } from 'react'
import ChatMessage from '@/components/(private)/ChatMessage'
import UserInput from '@/components/(private)/UserInput'
import ServerSelector from '@/components/(private)/ServerSelector'
import { ScrollShadow } from '@nextui-org/scroll-shadow'
import { Server, Message } from '@/types/chat'
import toast from 'react-hot-toast'
import { Image } from '@nextui-org/react'
import ussLogo from '../../../../public/uss_logo.webp'

const servers: Server[] = [
  { key: 'local', name: 'Servidor Local', url: 'http://localhost:11434' }
]

const defaultMessages: Message[] = []

export default function ChatComponent({
  messages = defaultMessages
}: {
  messages?: Array<Message>
}): React.ReactElement {
  const [selectedServer, setSelectedServer] = useState(servers[0].url)
  const [chatMessages, setChatMessages] = useState<Message[]>(messages)

  const handleServerChange = (serverUrl: string) => {
    setSelectedServer(serverUrl)
    toast.success(
      `Conectado a ${servers.find((s) => s.url === serverUrl)?.name}`
    )
  }

  const hasMessages = chatMessages.length > 0
  return (
    <div className='flex flex-col h-full'>
      <div className='p-4'>
        <ServerSelector
          servers={servers}
          selectedServer={selectedServer}
          onServerChange={handleServerChange}
        />
      </div>
      <ScrollShadow size={50} className='flex-grow p-4'>
        {hasMessages ? (
          <div className='space-y-4'>
            {chatMessages.map((message, index) => {
              const prevMessage = index > 0 ? chatMessages[index - 1] : null
              const showLabel = prevMessage?.type !== message.type

              return (
                <ChatMessage
                  key={index}
                  type={message.type}
                  message={message.content}
                  showLabel={showLabel}
                />
              )
            })}
          </div>
        ) : (
          <div className='flex items-center justify-center h-full text-gray-500'>
            <div className='flex mx-2 mb-6 mt-2 gap-2 items-center opacity-50'>
              <Image
                src='/uss_logo.webp'
                radius='none'
                alt='USS Logo'
                width={ussLogo.width / 18}
                className='dark:invert'
              />
              <h1 className='text-2xl font-bold text-primary font-frances'>
                SipánGPT
              </h1>
            </div>
          </div>
        )}
      </ScrollShadow>
      <div className='mt-auto'>
        <UserInput />
      </div>
      {/* <FeedbackModal /> */}
    </div>
  )
}

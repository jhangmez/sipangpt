'use client'

import { useState } from 'react'
import ChatMessage from '@/components/(private)/ChatMessage'
import UserInput from '@/components/(private)/UserInput'
import ServerSelector from '@/components/(private)/ServerSelector'
import { ScrollShadow } from '@nextui-org/scroll-shadow'
import messages from '@utils/mensajes.json'
import { Server } from '@/types/chat'
import toast from 'react-hot-toast'

const servers: Server[] = [
  { key: 'local', name: 'Servidor Local', url: 'http://localhost:11434' },
  { key: 'vps1', name: 'Servidor VPS', url: 'https://tu-vps-url.com' }
]

export default function ChatComponent(): React.ReactElement {
  const [selectedServer, setSelectedServer] = useState(servers[0].url)
  const handleServerChange = (serverUrl: string) => {
    setSelectedServer(serverUrl)
    toast.success(
      `Conectado a ${servers.find((s) => s.url === serverUrl)?.name}`
    )
  }
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
        <div className='space-y-4'>
          {messages.map((message, index) => (
            <div key={index} className='space-y-4'>
              <ChatMessage type='user' message={message.question} />
              <ChatMessage type='bot' message={message.answer} />
              <ChatMessage type='admin' message={message.answer} />
            </div>
          ))}
        </div>
      </ScrollShadow>
      <div className='mt-auto'>
        <UserInput />
      </div>
      {/* <FeedbackModal /> */}
    </div>
  )
}

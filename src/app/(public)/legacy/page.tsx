'use client'

import { useState } from 'react'
import Header from '@Components/(private)/Header'
import Sidebar from '@Components/(private)/Sidebar'
import ChatInterface from '@Components/(private)/ChatInterference'
import { MessageCustom } from '@/types/chat'
import toast from 'react-hot-toast'

export default function Home() {
  const [conversations, setConversations] = useState<{
    [key: string]: MessageCustom[]
  }>({})
  const [activeConversation] = useState<string>('default')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (message: string) => {
    setIsLoading(true)
    try {
      // Agregar mensaje del usuario
      const newMessage: MessageCustom = {
        type: 'user',
        content: message
      }

      // Actualizamos la conversación de forma segura
      setConversations((prev) => {
        const currentMessages = prev[activeConversation] || []
        return {
          ...prev,
          [activeConversation]: [...currentMessages, newMessage]
        }
      })

      // Aquí iría tu lógica para obtener la respuesta del servidor
      // const response = await yourApiCall(message)

      // Ejemplo de respuesta del bot
      const botResponse: MessageCustom = {
        type: 'bot',
        content: 'Respuesta de ejemplo'
      }

      setConversations((prev) => {
        const currentMessages = prev[activeConversation] || []
        return {
          ...prev,
          [activeConversation]: [...currentMessages, botResponse]
        }
      })
    } catch (error) {
      toast.error('Error al enviar el mensaje')
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener los mensajes de la conversación activa de forma segura
  const activeMessages = conversations[activeConversation] || []
  return (
    <main className='flex h-screen overflow-hidden'>
      <Sidebar />
      <div className='flex flex-col w-full'>
        <Header />
        <div className='flex-grow overflow-hidden'>
          <ChatInterface
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            conversationId={activeConversation}
          />
        </div>
      </div>
    </main>
  )
}

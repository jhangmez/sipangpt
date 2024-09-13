import React from 'react'
import ChatMessage from '@/components/(private)/ChatMessage'
import UserInput from '@/components/(private)/UserInput'
import { ScrollShadow } from '@nextui-org/scroll-shadow'

export default function ChatComponent(): React.ReactElement {
  return (
    <div className='flex flex-col h-full'>
      <ScrollShadow size={50} className='flex-grow p-4'>
        <div className='space-y-4'>
          <ChatMessage
            type='bot'
            message={`No te preocupes. Para restablecer tu contraseña, ve a **campus.uss.edu.pe** y sigue estos pasos:\n1. Selecciona **'¿Olvidaste tu contraseña?'**.\n2. Ingresa tu **usuario** y **correo electrónico**.\n3. Recibirás un correo con un **código**.\n4. Introduce el código y podrás crear una nueva contraseña.`}
          />
          <ChatMessage
            type='user'
            message={`Hola, quisiera ayuda para acceder a mi campus.`}
          />
          <ChatMessage
            type='bot'
            message={`No te preocupes. Para restablecer tu contraseña, ve a **campus.uss.edu.pe** y sigue estos pasos:\n1. Selecciona **'¿Olvidaste tu contraseña?'**.\n2. Ingresa tu **usuario** y **correo electrónico**.\n3. Recibirás un correo con un **código**.\n4. Introduce el código y podrás crear una nueva contraseña.`}
          />
          <ChatMessage
            type='user'
            message={`Hola, quisiera ayuda para acceder a mi campus.`}
          />
          {/* Add more messages as needed */}
        </div>
      </ScrollShadow>
      <div className='mt-auto'>
        <UserInput />
      </div>
      {/* <FeedbackModal /> */}
    </div>
  )
}

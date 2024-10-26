import React from 'react'
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/react'
interface UserInputFormProps {
  onSendMessage: (message: string) => void
  disabled: boolean
  placeholder?: string
}

export default function UserInputForm({
  onSendMessage,
  disabled,
  placeholder = 'Escribe tu mensaje...'
}: UserInputFormProps) {
  return (
    <div className='w-full p-4 border-t border-gray-200'>
      <form className='flex items-center'>
        <Input
          placeholder={placeholder}
          className='flex-1 mr-2 dark:text-gray-100 resize-none'
        />
        <Button
          type='submit'
          onClick={() => onSendMessage('')}
          className='text-onPrimary bg-primary dark:text-onPrimary dark:bg-primary font-frances font-bold'
          disabled={disabled}
        >
          Enviar
        </Button>
      </form>
    </div>
  )
}

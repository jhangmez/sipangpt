import React from 'react'
import { Textarea } from '@nextui-org/input'
import { Button } from '@nextui-org/react'

export default function UserInputForm() {
  return (
    <div className='w-full p-4 border-t border-gray-200'>
      <form className='flex items-center'>
        <Textarea
          placeholder='Escribe tu mensaje...'
          className='flex-1 mr-2 dark:text-gray-100 resize-none'
        />
        <Button
          type='submit'
          className='text-onPrimary bg-primary dark:text-onPrimary dark:bg-primary font-frances font-bold'
        >
          Enviar
        </Button>
      </form>
    </div>
  )
}

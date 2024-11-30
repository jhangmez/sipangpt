'use client'

import React from 'react'
import { ChatContainer } from '@/components/chat/chat-container'

export default function Home() {
  return (
    <main className='flex h-[calc(100dvh)] flex-col items-center'>
      <ChatContainer />
    </main>
  )
}

'use client'

import { ChatContainer } from '@/components/chat/chat-container'

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main className='flex h-[calc(100dvh)] flex-col items-center'>
      <ChatContainer initialChatId={params.id} />
    </main>
  )
}

import React from 'react'
import { marked } from 'marked'

interface MessageProps {
  type: 'user' | 'system' | 'bot'
  message: string
}

export default function ChatMessage({
  type,
  message
}: MessageProps): React.ReactElement {
  const formattedMessage = marked.parse(message)

  return (
    <div
      className={`flex font-exo ${
        type === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-3/4 p-3 rounded-lg ${
          type === 'user'
            ? 'bg-secondary text-onPrimary'
            : 'bg-white text-gray-900 dark:bg-gray-700 dark:text-secondary'
        }`}
      >
        <div dangerouslySetInnerHTML={{ __html: formattedMessage }} />
      </div>
    </div>
  )
}

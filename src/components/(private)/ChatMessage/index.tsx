import { marked } from 'marked'

interface MessageProps {
  type: 'user' | 'admin' | 'bot' | 'feedback' | 'form'
  message: string
  showLabel?: boolean
}

export default function ChatMessage({
  type,
  message,
  showLabel = true
}: MessageProps): React.ReactElement {
  const formattedMessage = marked.parse(message)

  const getMessageClasses = () => {
    switch (type) {
      case 'user':
        return 'bg-secondary text-onPrimary'
      case 'admin':
        return 'bg-gray-100 text-gray-900 dark:bg-gray-200 dark:text-gray-900'
      case 'feedback':
        return 'bg-purple-200 text-gray-900 dark:bg-purple-700 dark:text-white'
      case 'form':
        return 'bg-yellow-100 text-gray-900 dark:bg-yellow-600 dark:text-white'
      default:
        return 'bg-white text-gray-900 dark:bg-gray-700 dark:text-secondary'
    }
  }

  const getSenderName = () => {
    switch (type) {
      case 'user':
        return 'Usuario'
      case 'admin':
        return 'DTI'
      case 'feedback':
        return 'Feedback'
      case 'form':
        return 'Formulario'
      default:
        return 'SipanGPT'
    }
  }

  const getSenderClasses = () => {
    switch (type) {
      case 'user':
        return 'text-gray-500'
      case 'admin':
        return 'text-gray-500'
      case 'feedback':
        return 'text-purple-600 dark:text-purple-300'
      case 'form':
        return 'text-yellow-600 dark:text-yellow-300'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div
      className={`flex flex-col font-exo ${
        type === 'user' ? 'items-end' : 'items-start'
      }`}
    >
      {showLabel && (
        <span className={`text-xs mb-1 px-3 ${getSenderClasses()}`}>
          {getSenderName()}
        </span>
      )}
      <div className={`max-w-3/4 p-3 rounded-lg ${getMessageClasses()}`}>
        <div dangerouslySetInnerHTML={{ __html: formattedMessage }} />
      </div>
    </div>
  )
}

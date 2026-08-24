'use client'

import * as React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ChatErrorAlertProps {
  error: string
  onRetry: () => void
}

export function ChatErrorAlert({ error, onRetry }: ChatErrorAlertProps) {
  return (
    <div className='rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between gap-3 font-exo'>
      <div className='flex items-center gap-2'>
        <AlertCircle className='h-4 w-4 shrink-0' />
        <span>{error}</span>
      </div>
      <button
        type='button'
        onClick={onRetry}
        className='flex items-center gap-1 font-semibold hover:underline cursor-pointer'
      >
        <RefreshCw className='h-3.5 w-3.5' /> Reintentar
      </button>
    </div>
  )
}

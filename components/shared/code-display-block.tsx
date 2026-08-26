'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { CodeBlockProps } from '@/types/chat'
import { cn } from '@/lib/utils'

export function CodeDisplayBlock({
  code,
  lang = 'tsx',
  title
}: CodeBlockProps) {
  const [isCopied, setIsCopied] = React.useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      toast.success('¡Código copiado al portapapeles!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar el código')
    }
  }

  return (
    <div className='relative my-3 rounded-2xl border border-border/80 bg-zinc-950 text-zinc-100 overflow-hidden shadow-md'>
      <div className='flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 text-xs font-mono text-zinc-400'>
        <span>{title || lang}</span>
        <button
          type='button'
          onClick={copyToClipboard}
          className='flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition'
        >
          {isCopied ? (
            <>
              <Check className='w-3.5 h-3.5 text-emerald-400' />
              <span className='text-emerald-400'>Copiado</span>
            </>
          ) : (
            <>
              <Copy className='w-3.5 h-3.5' />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      <pre className='p-4 text-xs font-mono overflow-x-auto leading-relaxed'>
        <code>{code}</code>
      </pre>
    </div>
  )
}

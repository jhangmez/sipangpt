'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default'
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  isLoading = false,
  onConfirm,
}: ConfirmAlertDialogProps) {
  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault()
    await onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='font-exo rounded-3xl p-6 max-w-md'>
        <AlertDialogHeader className='space-y-3'>
          <AlertDialogMedia className={cn(
            'size-11 rounded-2xl flex items-center justify-center',
            variant === 'destructive' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          )}>
            {variant === 'destructive' ? (
              <Trash2 className='size-5' />
            ) : (
              <AlertTriangle className='size-5' />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle className='font-frances text-lg font-bold text-foreground text-left'>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-xs text-muted-foreground leading-relaxed text-left'>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className='pt-3 gap-2'>
          <AlertDialogCancel
            disabled={isLoading}
            className='rounded-xl text-xs font-semibold cursor-pointer'
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={isLoading}
            className={cn(
              'rounded-xl text-xs font-semibold cursor-pointer gap-1.5',
              variant === 'destructive' && 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700'
            )}
          >
            {isLoading && <RefreshCw className='size-3.5 animate-spin' />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

'use client'

import * as React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Smile, ChevronDown } from 'lucide-react'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

const ICON_CATEGORIES = [
  {
    name: 'Trámites y Matrícula',
    icons: ['📋', '📝', '📑', '📄', '📂', '📁', '📅', '🗓️', '⏰', '💳']
  },
  {
    name: 'Académico y Universidad',
    icons: ['🎓', '🏛️', '🏫', '📚', '📖', '💡', '🎯', '👨‍🎓', '👩‍🎓', '🎖️']
  },
  {
    name: 'Reglamentos y Legal',
    icons: ['⚖️', '📜', '🔒', '🛡️', '📌', '🔍', '🔎', '✅', '⚠️', 'ℹ️']
  },
  {
    name: 'Carreras y Tecnología',
    icons: ['💻', '🖥️', '⚡', '🤖', '🚀', '🌐', '🔬', '🎨', '💼', '📊']
  }
]

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            className='h-10 w-full rounded-xl border-border/80 px-3 flex items-center justify-between text-left font-exo gap-2 hover:bg-muted/70'
          >
            <div className='flex items-center gap-2'>
              <span className='text-xl shrink-0'>{value || '📋'}</span>
              <span className='text-xs text-muted-foreground hidden sm:inline'>
                Cambiar ícono
              </span>
            </div>
            <ChevronDown className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
          </Button>
        }
      />
      <PopoverContent
        className='w-72 p-3 font-exo rounded-2xl border border-border/80 shadow-xl'
        align='start'
      >
        <div className='space-y-3'>
          <div className='flex items-center justify-between border-b border-border/40 pb-2'>
            <span className='text-xs font-bold text-foreground flex items-center gap-1.5'>
              <Smile className='w-4 h-4 text-primary' /> Selecciona un Ícono
            </span>
            <span className='text-base'>{value}</span>
          </div>

          <div className='space-y-3 max-h-60 overflow-y-auto pr-1'>
            {ICON_CATEGORIES.map((cat) => (
              <div key={cat.name} className='space-y-1.5'>
                <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>
                  {cat.name}
                </p>
                <div className='grid grid-cols-5 gap-1'>
                  {cat.icons.map((icon) => (
                    <button
                      key={icon}
                      type='button'
                      onClick={() => {
                        onChange(icon)
                        setOpen(false)
                      }}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg hover:bg-primary/10 hover:scale-110 transition-all ${
                        value === icon
                          ? 'bg-primary/20 ring-1 ring-primary'
                          : 'bg-muted/40'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

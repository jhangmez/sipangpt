'use client'

import * as React from 'react'
import { FileText, X } from 'lucide-react'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import type { AttachedFile } from '@/types/chat'

interface ChatAttachmentsPreviewProps {
  files: AttachedFile[]
  onRemove: (id: string) => void
}

export function ChatAttachmentsPreview({
  files,
  onRemove,
}: ChatAttachmentsPreviewProps) {
  if (files.length === 0) return null

  return (
    <div className='px-4 pt-2 font-exo'>
      <AttachmentGroup>
        {files.map((file) => (
          <Attachment
            key={file.id}
            size='sm'
            className='rounded-2xl border border-border/80 bg-card'
          >
            <AttachmentMedia>
              <FileText className='h-4 w-4 text-primary' />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.name}</AttachmentTitle>
              <AttachmentDescription>{file.size}</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction
                aria-label={`Eliminar ${file.name}`}
                onClick={() => onRemove(file.id)}
              >
                <X className='h-3.5 w-3.5' />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        ))}
      </AttachmentGroup>
    </div>
  )
}

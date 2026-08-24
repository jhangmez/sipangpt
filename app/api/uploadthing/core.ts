import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { auth } from '@/auth'

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth()
      // Si deseas restringir a usuarios logueados:
      // if (!session?.user) throw new UploadThingError('No autorizado')
      return { userId: session?.user?.id || 'anonymous' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId)
      console.log('file url', file.ufsUrl)
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),

  documentUploader: f({
    pdf: {
      maxFileSize: '16MB',
      maxFileCount: 5,
    },
    text: {
      maxFileSize: '4MB',
      maxFileCount: 5,
    },
  })
    .middleware(async () => {
      const session = await auth()
      return { userId: session?.user?.id || 'anonymous' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Document upload complete:', file.ufsUrl)
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

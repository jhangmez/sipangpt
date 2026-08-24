import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const f = createUploadthing({
  errorFormatter: (err) => {
    return {
      message: err.message,
      cause: err.cause ? String(err.cause) : null,
    }
  },
})

export const ourFileRouter = {
  // Subida de imagen de perfil o pública
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user?.id) {
        throw new UploadThingError('Debes iniciar sesión para subir imágenes.')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Imagen subida con éxito para el usuario:', metadata.userId)
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),

  // Subida de documentos oficiales para RAG / Conocimiento (protegido)
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
      if (!session?.user?.id) {
        throw new UploadThingError('Debes iniciar sesión para subir documentos.')
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Guardar el documento en la base de datos Prisma
      const doc = await prisma.document.create({
        data: {
          title: file.name,
          fileName: file.name,
          fileUrl: file.ufsUrl,
          publicUrl: file.ufsUrl,
          mimeType: file.type || 'application/pdf',
          sizeBytes: file.size,
          uploadedById: metadata.userId,
          status: 'PROCESSING',
        },
      })
      console.log('Documento registrado en la base de datos con ID:', doc.id)
      return { documentId: doc.id, uploadedBy: metadata.userId, url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

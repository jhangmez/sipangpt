import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const f = createUploadthing({
  errorFormatter: (err) => {
    return {
      message: err.message,
      cause: err.cause ? String(err.cause) : null
    }
  }
})

export const ourFileRouter = {
  // Subida de imagen de perfil o pública
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1
    }
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
      maxFileCount: 5
    },
    text: {
      maxFileSize: '4MB',
      maxFileCount: 5
    },
    blob: {
      maxFileSize: '4MB',
      maxFileCount: 5
    }
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user?.id) {
        throw new UploadThingError(
          'Debes iniciar sesión para subir documentos.'
        )
      }
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // 1. Registrar el documento en la base de datos Prisma
      const doc = await prisma.document.create({
        data: {
          title: file.name,
          fileName: file.name,
          fileUrl: file.ufsUrl,
          publicUrl: file.ufsUrl,
          mimeType: file.type || 'application/pdf',
          sizeBytes: file.size,
          uploadedById: metadata.userId,
          status: 'PROCESSING'
        }
      })
      console.log(
        `[UPLOADTHING] 📄 Documento registrado en BD con ID: ${doc.id}`
      )

      // 2. Transcribir e indexar automáticamente de una sola vez con Gemini 3.1 Flash-Lite
      try {
        const { extractAndStructureToMarkdown, indexDocumentContent } =
          await import('@/lib/ai/document-processor')
        const markdownContent = await extractAndStructureToMarkdown(
          file.ufsUrl,
          file.type || 'application/pdf'
        )
        const result = await indexDocumentContent(doc.id, markdownContent)
        console.log(
          `[UPLOADTHING] ✅ Auto-indexación completada para "${file.name}" (${result.chunkCount} chunks)`
        )
      } catch (autoErr) {
        console.error(
          `[UPLOADTHING] ❌ Error en auto-indexación para doc ID ${doc.id}:`,
          autoErr
        )
        await prisma.document.update({
          where: { id: doc.id },
          data: { status: 'ERROR' }
        })
      }

      return {
        documentId: doc.id,
        uploadedBy: metadata.userId,
        url: file.ufsUrl
      }
    })
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

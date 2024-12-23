// app/api/chat/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { FeedbackData } from '@Components/(private)/feedback-modal'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/prisma'
import { UTApi, UTFile } from 'uploadthing/server' // Importar UTFile

// Inicializar UTApi (asegúrate de tener las variables de entorno UPLOADTHING_SECRET y UPLOADTHING_APP_ID configuradas)
const utapi = new UTApi()

export async function POST(req: NextRequest) {
  try {
    const feedbackData: FeedbackData & { messageIndex: number } =
      await req.json()

    // Generar un ID único para el archivo
    const fileId = uuidv4()
    const fileName = `feedback-${fileId}.json`
    const jsonData = JSON.stringify(feedbackData, null, 2)

    // Subir el archivo JSON a UploadThing usando UTApi
    const file = new UTFile([jsonData], fileName, { type: 'application/json' })
    const uploadRes = await utapi.uploadFiles(file)

    // Manejar errores de subida
    if (uploadRes.error) {
      throw new Error('UploadThing upload failed: ' + uploadRes.error.message)
    }
    // Crear entrada en la base de datos con el link al archivo
    const feedbackEntry = await prisma.feedback.create({
      data: {
        url: uploadRes.data.url,
        key: uploadRes.data.key, // Guarda la clave del archivo
        uploadedBy: feedbackData.id_usuario ?? 'anonymous',
        messageIndex: feedbackData.messageIndex
      }
    })

    return NextResponse.json({
      success: true,
      fileUrl: uploadRes.data.url,
      fileKey: uploadRes.data.key
    })
  } catch (error) {
    console.error('Error al guardar el feedback:', error)
    return NextResponse.json(
      { success: false, error: 'Hubo un error al guardar el feedback.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '5')
    const skip = (page - 1) * limit

    const feedbacks = await prisma.feedback.findMany({
      select: {
        // Selecciona solo los campos necesarios
        id: true,
        url: true,
        messageIndex: true,
        createdAt: true,
        user: {
          select: {
            image: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const total = await prisma.feedback.count()

    return NextResponse.json({ feedbacks, total })
  } catch (error) {
    console.error('Error fetching feedbacks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedbacks' },
      { status: 500 }
    )
  }
}

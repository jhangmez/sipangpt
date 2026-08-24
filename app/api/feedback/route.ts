import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()

    const {
      id_mensaje,
      mensaje_usuario,
      respuesta,
      puntuacion,
      tipo,
      feedback,
      consentimientoCorreo,
      model,
    } = body

    try {
      const feedbackRecord = await prisma.feedback.create({
        data: {
          userId: session?.user?.id || null,
          rating: typeof puntuacion === 'number' ? puntuacion : null,
          comment: [
            tipo ? `[Tipo: ${tipo}]` : null,
            model ? `[Modelo: ${model}]` : null,
            consentimientoCorreo ? `[Consentimiento Correo: Sí]` : null,
            feedback ? `Comentario: ${feedback}` : null,
            mensaje_usuario ? `Pregunta: ${mensaje_usuario}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      })

      return NextResponse.json({ success: true, id: feedbackRecord.id })
    } catch (dbError) {
      console.warn('[FEEDBACK_DB_FALLBACK]', dbError)
      return NextResponse.json({ success: true, fallback: true })
    }
  } catch (error: any) {
    console.error('[FEEDBACK_API_ERROR]', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al procesar el feedback' },
      { status: 500 }
    )
  }
}

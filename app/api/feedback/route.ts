import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()

    const {
      id_mensaje,
      puntuacion,
      reasons,
      feedback,
      consentimientoCorreo,
      model,
    } = body

    const rating = typeof puntuacion === 'number' ? Math.min(Math.max(puntuacion, 1), 5) : 5
    const reasonsArray = Array.isArray(reasons) ? reasons : []

    const formattedComment = [
      model ? `[Modelo: ${model}]` : null,
      consentimientoCorreo ? `[Consentimiento Encuestas: Sí]` : null,
      feedback ? feedback.trim() : null,
    ]
      .filter(Boolean)
      .join(' | ')

    const feedbackRecord = await prisma.feedback.create({
      data: {
        userId: session?.user?.id || null,
        messageId: id_mensaje || null,
        rating,
        reasons: reasonsArray,
        comment: formattedComment || null,
      },
    })

    // Si el usuario calificó, su veredicto es verdad absoluta sobre el estado del mensaje
    if (id_mensaje) {
      const resolutionStatus =
        rating >= 4
          ? 'POSITIVE_FEEDBACK'
          : rating <= 2
          ? 'NEGATIVE_FEEDBACK'
          : undefined

      if (resolutionStatus) {
        await prisma.message.update({
          where: { id: id_mensaje },
          data: { resolutionStatus },
        }).catch((e) => console.warn('[MESSAGE_RESOLUTION_UPDATE_ERROR]', e))
      }
    }

    return NextResponse.json({ success: true, id: feedbackRecord.id })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al procesar el feedback'
    console.error('[FEEDBACK_API_ERROR]', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

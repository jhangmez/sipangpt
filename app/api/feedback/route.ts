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

    // Verificar integridad referencial del mensaje calificado con reintento por concurrencia con streaming
    let safeMessageId: string | null = null
    if (id_mensaje) {
      let targetMsg = await prisma.message
        .findUnique({
          where: { id: id_mensaje },
          select: { id: true },
        })
        .catch(() => null)

      if (!targetMsg) {
        await new Promise((r) => setTimeout(r, 400))
        targetMsg = await prisma.message
          .findUnique({
            where: { id: id_mensaje },
            select: { id: true },
          })
          .catch(() => null)
      }

      safeMessageId = targetMsg?.id || null
    }

    const feedbackRecord = await prisma.feedback.create({
      data: {
        userId: session?.user?.id || null,
        messageId: safeMessageId,
        rating,
        reasons: reasonsArray,
        comment: formattedComment || null,
      },
    })

    // Si el mensaje existe en la base de datos, actualizar su resolutionStatus
    if (safeMessageId) {
      const resolutionStatus =
        rating >= 4
          ? 'POSITIVE_FEEDBACK'
          : rating <= 2
          ? 'NEGATIVE_FEEDBACK'
          : undefined

      if (resolutionStatus) {
        await prisma.message.update({
          where: { id: safeMessageId },
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

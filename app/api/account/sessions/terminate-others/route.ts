import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el sessionToken actual desde las cookies o de la sesión
    const cookieToken =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value ||
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value

    const currentSessionToken =
      cookieToken || (session.user as { sessionToken?: string }).sessionToken

    // Eliminar todas las sesiones del usuario excepto la actual
    await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
        sessionToken: currentSessionToken ? { not: currentSessionToken } : undefined,
      },
    })

    return NextResponse.json({
      message: 'Todas las otras sesiones han sido cerradas exitosamente',
    })
  } catch (error) {
    console.error('Error terminating other sessions:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma, Role } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionToken } = body

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Token de sesión requerido' },
        { status: 400 }
      )
    }

    // Obtener el sessionToken actual para evitar que el usuario cierre su propia sesión por este endpoint
    const cookieToken =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value ||
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value

    const currentSessionToken =
      cookieToken || (session.user as { sessionToken?: string }).sessionToken

    if (sessionToken === currentSessionToken) {
      return NextResponse.json(
        { error: 'No puedes cerrar tu sesión actual desde este botón. Utiliza el botón de cerrar sesión.' },
        { status: 400 }
      )
    }

    // Verificar que la sesión pertenece al usuario actual o es ADMIN
    const sessionToDelete = await prisma.session.findUnique({
      where: { sessionToken },
    })

    if (!sessionToDelete) {
      return NextResponse.json(
        { error: 'Sesión no encontrada o ya finalizada' },
        { status: 404 }
      )
    }

    if (sessionToDelete.userId !== session.user.id && session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'No tienes permisos para cerrar esta sesión' },
        { status: 403 }
      )
    }

    // Eliminar la sesión
    await prisma.session.delete({
      where: { sessionToken },
    })

    return NextResponse.json({
      message: 'Sesión cerrada correctamente',
    })
  } catch (error) {
    console.error('Error terminating session:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { auth } from '@root/auth'

export async function DELETE(
  req: Request,
  { params }: { params: { sessionToken: string } }
) {
  const session = await auth()
  const { sessionToken } = params

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verifica que la sesión a eliminar pertenezca al usuario actual
    const sessionToDelete = await prisma.session.findUnique({
      where: {
        sessionToken: sessionToken
      }
    })

    if (!sessionToDelete || sessionToDelete.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para cerrar esta sesión' },
        { status: 403 }
      )
    }

    // Eliminar la sesión
    await prisma.session.delete({
      where: {
        sessionToken: sessionToken
      }
    })

    return NextResponse.json({ message: 'Sesión cerrada' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al cerrar la sesión' },
      { status: 500 }
    )
  }
}

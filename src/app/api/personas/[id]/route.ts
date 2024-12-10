import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { auth } from '@root/auth'
import { revalidatePath } from 'next/cache'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = params.id

  try {
    // Actualizar el rol del usuario a 'user' en lugar de eliminarlo
    const updatedUser = await prisma.user.update({
      where: {
        id: id
      },
      data: {
        role: 'user'
      }
    })

    revalidatePath('/admin/personas')

    return NextResponse.json({
      message: 'Rol de administrador revocado',
      user: updatedUser
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al revocar el rol de administrador' },
      { status: 500 }
    )
  }
}

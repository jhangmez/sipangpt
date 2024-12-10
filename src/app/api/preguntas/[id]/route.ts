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

  const id = Number(params.id)

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  try {
    await prisma.pregunta.delete({
      where: {
        id: id
      }
    })

    revalidatePath('/admin/preguntas')

    return NextResponse.json({ message: 'Pregunta eliminada' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al eliminar la pregunta' },
      { status: 500 }
    )
  }
}

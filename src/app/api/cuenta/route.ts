import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { auth } from '@root/auth'

export async function GET() {
  const session = await auth()

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al obtener los datos del usuario' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  const session = await auth()

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, first_name, last_name } = await req.json()

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        name,
        first_name,
        last_name
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 }
    )
  }
}
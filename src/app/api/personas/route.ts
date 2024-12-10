import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { auth } from '@root/auth'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  const session = await auth()

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email } = await req.json()

    // Verificar si el correo electrónico existe
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'El correo electrónico no existe.' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya tiene el rol de 'admin'
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'El usuario ya tiene el rol de administrador.' },
        { status: 400 }
      )
    }

    // Actualizar el rol del usuario a 'admin'
    const updatedUser = await prisma.user.update({
      where: {
        email: email
      },
      data: {
        role: 'admin'
      }
    })

    revalidatePath('/admin/personas')

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al agregar a la persona como administrador' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const personas = await prisma.user.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(personas)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al obtener las personas' },
      { status: 500 }
    )
  }
}

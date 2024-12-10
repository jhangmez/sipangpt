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
    const { contenido, creadoPorId } = await req.json()

    const nuevaPregunta = await prisma.pregunta.create({
      data: {
        contenido,
        creadoPor: {
          connect: {
            id: creadoPorId
          }
        }
      }
    })

    revalidatePath('/admin/preguntas')

    return NextResponse.json(nuevaPregunta)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al crear la pregunta' },
      { status: 500 }
    )
  }
}

// Asegúrate de que la ruta para obtener las preguntas siga siendo GET
export async function GET() {
  try {
    const preguntas = await prisma.pregunta.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        creadoPor: true
      }
    })

    return NextResponse.json(preguntas)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error al obtener las preguntas' },
      { status: 500 }
    )
  }
}

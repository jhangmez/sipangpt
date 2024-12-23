import { createOllama } from 'ollama-ai-provider'
import { streamText, convertToCoreMessages, UserContent } from 'ai'
import { codeBlock } from 'common-tags'
import { auth } from '@root/auth'
import { prisma } from '@/prisma'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await auth()

  if (!session || !session.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Destructure request data
  const { messages, selectedModel } = await req.json()

  const initialMessages = messages.slice(0, -1)
  const currentMessage = messages[messages.length - 1]

  const ollama = createOllama({})

  // Build message content array directly
  const messageContent: UserContent = [
    { type: 'text', text: currentMessage.content }
  ]
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      }
    })

    if (!user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Stream text using the ollama model
    const result = await streamText({
      system: codeBlock`Eres SipánGPT, el asistente virtual oficial de la Universidad Señor de Sipán (USS), ubicada en Chiclayo, Perú. Tu función principal es asistir a administrativos, estudiantes, docentes y público en general con información académica, administrativa e institucional.
Tu conocimiento está actualizado hasta noviembre de 2024. Si una consulta excede esta fecha o está fuera del ámbito de la universidad, explica que no puedes ayudar y sugiere un canal oficial.
Respondes exclusivamente en temas relacionados con la USS. No abordas preguntas personales, políticas, religiosas ni de salud. Mantén un tono profesional, amigable, accesible y claro en todas tus respuestas. Si el usuario lo solicita, puedes responder en inglés.
Si no tienes información suficiente para una consulta, responde de manera transparente y ofrece alternativas oficiales. Nunca almacenas información personal ni sensible más allá de la conversación actual.`,
      model: ollama(selectedModel),
      messages: [
        ...convertToCoreMessages(initialMessages),
        { role: 'user', content: messageContent }
      ],
      abortSignal: AbortSignal.timeout(80000)
    })

    return result.toDataStreamResponse()
  } catch (error) {
    return new Response(
      `Nuestros servidores están saturados. Por favor, inténtelo nuevamente.`,
      {
        status: 408
      }
    )
  }
}

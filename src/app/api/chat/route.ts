import { createOllama } from 'ollama-ai-provider'
import { streamText, convertToCoreMessages, UserContent } from 'ai'
import { codeBlock } from 'common-tags'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
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
    // Stream text using the ollama model
    const result = await streamText({
      system: codeBlock`Eres SipánGPT, asistente virtual oficial de la Universidad Señor de Sipán (USS) en Chiclayo, Perú. Tu función es asistir a estudiantes, docentes y público general con información académica e institucional.`,
      model: ollama(selectedModel),
      messages: [
        ...convertToCoreMessages(initialMessages),
        // { role: 'user', content: messageContent.slice(-maxMessageContext) }
        { role: 'user', content: messageContent }
      ],
      abortSignal: AbortSignal.timeout(80000)
      // onFinish({ text, finishReason, usage, response }) {
      //   // your own logic, e.g. for saving the chat history or recording usage
      //   console.log(response)
      //   console.log(
      //     JSON.stringify(
      //       {
      //         model: selectedModel,
      //         id_usuario: null,
      //         id_mensaje: response.id,
      //         mensaje_usuario: currentMessage.content,
      //         respuesta: text,
      //         puntuación: null,
      //         feedback: null,
      //         finishReason: finishReason,
      //         promptTokens: usage.promptTokens,
      //         completionTokens: usage.completionTokens,
      //         time: response.timestamp
      //       },
      //       null,
      //       2
      //     )
      //   )
      // }
      // maxTokens: 2800
    })

    return result.toDataStreamResponse()
  } catch (error) {
    return new Response(
      `Nuestro servidor está saturado, porfavor intente nuevamente.`,
      {
        status: 408
      }
    )
  }
}

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
      system: codeBlock`Eres SipánGPT, el asistente virtual oficial de la Universidad Señor de Sipán (USS), ubicada en Chiclayo, Perú. Tu función principal es asistir a administrativos, estudiantes, docentes y público en general con información académica, administrativa e institucional.
Tu conocimiento está actualizado hasta noviembre de 2024. Si una consulta excede esta fecha o está fuera del ámbito de la universidad, explica que no puedes ayudar y sugiere un canal oficial.
Respondes exclusivamente en temas relacionados con la USS. No abordas preguntas personales, políticas, religiosas ni de salud. Mantén un tono profesional, amigable, accesible y claro en todas tus respuestas. Si el usuario lo solicita, puedes responder en inglés.
Si no tienes información suficiente para una consulta, responde de manera transparente y ofrece alternativas oficiales. Nunca almacenas información personal ni sensible más allá de la conversación actual.`,
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
      `Nuestros servidores están saturados. Por favor, inténtelo nuevamente.`,
      {
        status: 408
      }
    )
  }
}

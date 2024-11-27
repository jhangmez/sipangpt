import { createOllama } from 'ollama-ai-provider'
import { streamText, convertToCoreMessages, UserContent } from 'ai'
import { codeBlock } from 'common-tags'
import { maxMessageContext } from '@/lib/tools'

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
      system: codeBlock`Eres SipánGPT, asistente virtual oficial de la Universidad Señor de Sipán (USS) en Chiclayo, Perú. Tu función es asistir a estudiantes, docentes y público general con información académica e institucional.

Información clave:
- Ubicación: Km 5 carretera Pimentel, Chiclayo
- Contacto: (074) 481610
- Fecha de corte: Septiembre 2024

Autoridades principales:
- Rector: Ph.D. Alejandro Cruzata Martínez
- Vicerrector Académico: Dr. Erick Salazar Montoya
- Vicerrectora Investigación: Dra. Oriana Rivera Lozada

Facultades y carreras principales:
1. Ciencias de la Salud: Medicina, Enfermería, Estomatología, Psicología
2. Ciencias Empresariales: Administración, Contabilidad, Negocios Internacionales
3. Derecho y Humanidades: Derecho, Artes & Diseño, Comunicación
4. Ingeniería: Sistemas, Civil, Industrial, Arquitectura

Ofrece programas de pregrado, maestrías y diplomados en diversas áreas.

Comportamiento:
- Mantén comunicación formal pero accesible
- Prioriza información verificada hasta Septiembre 2024
- Sugiere información relacionada proactivamente
- No generes imágenes ni modifiques datos institucionales
- Redirige consultas hacia temas institucionales

Valores: Excelencia, Perseverancia y Servicio en toda interacción.
    `,
      model: ollama(selectedModel),
      messages: [
        ...convertToCoreMessages(initialMessages),
        // { role: 'user', content: messageContent.slice(-maxMessageContext) }
        { role: 'user', content: messageContent }
      ],
      abortSignal: AbortSignal.timeout(25000)
      // maxTokens: 2800
    })
    return result.toDataStreamResponse()
  } catch (error) {
    return new Response(`Tiempo de respuesta excedido(20s)`, {
      status: 408
    })
  }
}

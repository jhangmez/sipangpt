import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai'
import { auth } from '@/auth'
import { getLanguageModel } from '@/lib/ai/providers'
import { searchKnowledgeBase } from '@/lib/ai/rag'
import { prisma, ModelProvider } from '@/lib/prisma'
import { buildSystemPromptWithSources, DEFAULT_MODEL_CODE, DEFAULT_PROVIDER } from '@/constants'

export const maxDuration = 45

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json()
  const messages: UIMessage[] = body.messages || []
  const conversationId: string | undefined = body.conversationId
  const modelCode: string | undefined = body.modelCode
  const provider: ModelProvider | undefined = body.provider

  // 1. Extraer el texto del último mensaje del usuario
  const lastUserMessage = messages[messages.length - 1]
  const userText =
    lastUserMessage?.parts
      ?.filter((p) => p.type === 'text')
      .map((p) => (p as { text: string }).text)
      .join(' ') || ''

  // 2. Búsqueda RAG en la base de conocimiento universitaria (USS)
  const sources = await searchKnowledgeBase(userText, 3)

  // 3. Obtener instancia del modelo de IA solicitado
  const selectedModel = getLanguageModel(
    provider || DEFAULT_PROVIDER,
    modelCode || DEFAULT_MODEL_CODE
  )

  // 4. Instrucciones del sistema centralizadas desde constants/prompts.ts
  const systemPrompt = buildSystemPromptWithSources(sources)

  // 5. Streaming de respuesta con AI SDK
  const result = streamText({
    model: selectedModel,
    instructions: systemPrompt,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text, usage }) => {
      try {
        let activeConvId = conversationId

        // Si no hay ID de conversación, crear una nueva en la base de datos
        if (!activeConvId) {
          const newConv = await prisma.conversation.create({
            data: {
              userId: session.user.id,
              title: userText.slice(0, 60) || 'Consulta SipánGPT',
            },
          })
          activeConvId = newConv.id
        }

        // Guardar mensaje de usuario
        await prisma.message.create({
          data: {
            conversationId: activeConvId,
            role: 'USER',
            content: userText,
          },
        })

        // Guardar respuesta del asistente
        const assistantMsg = await prisma.message.create({
          data: {
            conversationId: activeConvId,
            role: 'ASSISTANT',
            content: text,
            modelUsed: modelCode || DEFAULT_MODEL_CODE,
            totalTokens: usage?.totalTokens,
            promptTokens: usage?.inputTokens,
          },
        })

        // Registrar citas RAG vinculadas a la respuesta
        if (sources.length > 0) {
          await prisma.messageCitation.createMany({
            data: sources.map((s) => ({
              messageId: assistantMsg.id,
              documentId: s.documentId,
              title: s.title,
              sourceUrl: s.sourceUrl,
              pageNumber: s.pageNumber,
              snippetText: s.snippetText,
              relevance: s.relevance,
            })),
          })
        }
      } catch (err) {
        console.error('[DATABASE_PERSIST_ERROR]', err)
      }
    },
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      sendSources: true,
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return {
            createdAt: Date.now(),
            model: modelCode || DEFAULT_MODEL_CODE,
          }
        }
        if (part.type === 'finish') {
          return {
            totalTokens: part.totalUsage.totalTokens,
          }
        }
      },
    }),
  })
}

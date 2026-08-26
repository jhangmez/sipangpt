import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  generateId,
  pruneMessages,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai'
import { auth } from '@/auth'
import { getLanguageModel } from '@/lib/ai/providers'
import { searchKnowledgeBase } from '@/lib/ai/rag'
import { detectResolutionStatus } from '@/lib/ai/resolution-detector'
import { prisma, ModelProvider, ResolutionStatus, TokenUsageConcept } from '@/lib/prisma'
import { recordTokenUsageLog } from '@/lib/ai/token-tracker'
import {
  buildSystemPromptWithSources,
  DEFAULT_MODEL_CODE,
  DEFAULT_PROVIDER,
} from '@/constants'

export const maxDuration = 45

export async function POST(req: Request) {
  const startTime = Date.now()
  const ipAddress =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  const userAgent = req.headers.get('user-agent') || 'Browser'

  // 1. Verificación de sesión de usuario autenticado
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'No autorizado. Inicie sesión.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Cuerpo de solicitud inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const conversationId: string | undefined = body.conversationId
  const modelCode: string = body.modelCode || DEFAULT_MODEL_CODE
  const provider: ModelProvider = body.provider || DEFAULT_PROVIDER
  const isVoiceInput: boolean = Boolean(body.isVoiceInput)

  // 2. Normalizar mensajes de entrada (soporta useChat UIMessage[] y solicitudes directas)
  let rawMessages: UIMessage[] = []
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    rawMessages = body.messages
  } else if (typeof body.message === 'string' && body.message.trim()) {
    rawMessages = [
      {
        id: generateId(),
        role: 'user',
        parts: [{ type: 'text', text: body.message.trim() }],
      },
    ]
  }

  // 3. Extraer el texto de la última consulta del usuario para búsqueda RAG
  const lastUserMsg = [...rawMessages].reverse().find((m) => m.role === 'user')
  const userText =
    lastUserMsg?.parts
      ?.filter((p) => p.type === 'text')
      .map((p) => (p as { text: string }).text)
      .join(' ')
      .trim() || ''

  const attachments: any[] = body.attachments || []

  if (!userText && attachments.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Debe ingresar una consulta o adjuntar un archivo.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // 3.5 Obtener configuración del sistema y políticas de búsqueda definidas por el Administrador
    const systemConfig = await prisma.systemSetting
      .findUnique({
        where: { id: 'global_config' },
      })
      .catch(() => null)

    const isRAGEnabled = systemConfig ? systemConfig.enableRAG : true
    const isWebSearchEnabled = systemConfig ? systemConfig.enableWebSearch : false
    const isMapsSearchEnabled = systemConfig ? systemConfig.enableMapsSearch : false
    const minSimScore = systemConfig?.minSimilarityScore ?? 0.50

    // 4. Búsqueda semántica RAG con embeddings de Gemini (gemini-embedding-2) respetando políticas
    const retrievalStartTime = Date.now()
    const sources =
      isRAGEnabled && userText
        ? await searchKnowledgeBase(userText, 3, minSimScore)
        : []
    const retrievalLatencyMs = Date.now() - retrievalStartTime

    // 5. Instanciar modelo de lenguaje (por defecto Gemini 3.1 Flash-Lite)
    const selectedModel = getLanguageModel(provider, modelCode)

    // 6. Construir prompt del sistema enriquecido con fuentes oficiales universitarias y políticas de búsqueda
    let systemPrompt = buildSystemPromptWithSources(sources)

    if (!isWebSearchEnabled) {
      systemPrompt += `\n\n[POLÍTICA DE BÚSQUEDA WEB: DESHABILITADA POR EL ADMINISTRADOR]
Tienes TERMINANTEMENTE PROHIBIDO inventar o buscar información en internet fuera de los reglamentos oficiales de la USS. Si la información no se encuentra en los documentos citados, debes responder con honestidad indicando que no dispones de dicha información en la base normativa actual y orientar al estudiante a los canales oficiales (informes@uss.edu.pe o Campus Virtual).`
    }

    if (!isMapsSearchEnabled) {
      systemPrompt += `\n\n[POLÍTICA DE MAPAS Y RUTAS: DESHABILITADA POR EL ADMINISTRADOR]
No inventes direcciones, rutas externas ni coordenadas de mapas fuera del Campus Principal de la USS en Chiclayo.`
    }

    // 7. Convertir mensajes de UI a ModelMessages de AI SDK
    const modelMessages = await convertToModelMessages(rawMessages, {
      convertDataPart: (part) => {
        if (part.type === 'data-file' && (part.data as any)?.base64) {
          const fileData = part.data as { base64: string; mediaType?: string; filename?: string }
          return {
            type: 'file',
            data: Buffer.from(fileData.base64, 'base64'),
            mediaType: fileData.mediaType || 'application/pdf',
            filename: fileData.filename,
          }
        }
      },
    })

    // Si hay archivos adjuntos en el body que no venían en las partes del mensaje, agregarlos
    if (attachments.length > 0 && modelMessages.length > 0) {
      const lastModelMsg = modelMessages[modelMessages.length - 1]
      if (lastModelMsg.role === 'user') {
        const fileParts: any[] = []
        for (const att of attachments) {
          if (att.data) {
            try {
              fileParts.push({
                type: 'file',
                data: Buffer.from(att.data, 'base64'),
                mediaType: att.type || 'application/pdf',
                filename: att.name,
              })
            } catch {
              // fallback
            }
          }
        }
        if (fileParts.length > 0) {
          if (typeof lastModelMsg.content === 'string') {
            lastModelMsg.content = [
              { type: 'text', text: lastModelMsg.content },
              ...fileParts,
            ]
          } else if (Array.isArray(lastModelMsg.content)) {
            lastModelMsg.content.push(...fileParts)
          }
        }
      }
    }

    // 8. Optimización de ventana de contexto: podar mensajes antiguos, reasoning y llamadas a herramientas anteriores
    const prunedMessages = pruneMessages({
      messages: modelMessages,
      reasoning: 'before-last-message',
      toolCalls: 'before-last-message',
      emptyMessages: 'remove',
    })

    // 9. Crear o recuperar la conversación en PostgreSQL inmediatamente para generar su ID
    let activeConvId = conversationId
    if (!activeConvId) {
      const newConv = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          title: (userText || 'Consulta SipánGPT').slice(0, 60),
        },
      })
      activeConvId = newConv.id
    } else {
      await prisma.conversation
        .update({
          where: { id: activeConvId },
          data: { updatedAt: new Date() },
        })
        .catch(() => {})
    }

    // Persistir mensaje del usuario inmediatamente
    await prisma.message.create({
      data: {
        conversationId: activeConvId,
        role: 'USER',
        content:
          userText ||
          `[Adjunto: ${attachments.map((a) => a.name).join(', ')}]`,
        isVoiceInput,
      },
    }).catch(() => {})

    // 10. Inferencia con streamText de Vercel AI SDK (conciso y rápido)
    const generationStartTime = Date.now()
    const result = streamText({
      model: selectedModel,
      instructions: systemPrompt,
      messages: prunedMessages,
      maxOutputTokens: 600,
      temperature: 0.3,
      onFinish: async ({ text, usage }) => {
        try {
          const totalDurationMs = Date.now() - startTime
          const generationLatencyMs = Date.now() - generationStartTime

          // Detectar estado analítico de resolución de la consulta
          const resolutionStatus: ResolutionStatus = detectResolutionStatus({
            citationsCount: sources.length,
            maxRelevance: sources[0]?.relevance || 0,
            responseText: text,
          })

          // Obtener categoría del primer documento si aplica
          let docCategoryId: string | null = null
          if (sources.length > 0 && sources[0].documentId) {
            const doc = await prisma.document
              .findUnique({
                where: { id: sources[0].documentId },
                select: { categoryId: true },
              })
              .catch(() => null)
            docCategoryId = doc?.categoryId || null
          }

          // Persistir mensaje del asistente con métricas de tokens y desglose de latencia
          let assistantMsg: any
          try {
            assistantMsg = await prisma.message.create({
              data: {
                conversationId: activeConvId,
                role: 'ASSISTANT',
                content: text,
                modelUsed: modelCode,
                embeddingModel: 'gemini-embedding-2',
                promptTokens: usage?.inputTokens || 0,
                totalTokens: usage?.totalTokens || 0,
                latencyMs: totalDurationMs,
                retrievalLatencyMs,
                generationLatencyMs,
                resolutionStatus,
                categoryId: docCategoryId,
              },
            })
          } catch (createErr) {
            // Fallback si la instancia en caliente aún no refrescó los campos nuevos
            assistantMsg = await prisma.message.create({
              data: {
                conversationId: activeConvId,
                role: 'ASSISTANT',
                content: text,
                modelUsed: modelCode,
                promptTokens: usage?.inputTokens || 0,
                totalTokens: usage?.totalTokens || 0,
                latencyMs: totalDurationMs,
                resolutionStatus,
                categoryId: docCategoryId,
              },
            })
          }

          // Persistir citas RAG vinculadas a la respuesta con chunkId y embeddingModel
          if (sources.length > 0 && assistantMsg?.id) {
            try {
              await prisma.messageCitation.createMany({
                data: sources.map((s) => ({
                  messageId: assistantMsg.id,
                  documentId: s.documentId,
                  chunkId: s.chunkId || null,
                  title: s.title,
                  sourceUrl: s.sourceUrl,
                  pageNumber: s.pageNumber,
                  snippetText: s.snippetText,
                  relevance: s.relevance,
                  embeddingModel: s.embeddingModel || 'gemini-embedding-2',
                })),
              })
            } catch {
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
              }).catch(() => {})
            }
          }

          // Actualizar consumo de tokens del usuario
          const tokensToAdd = usage?.totalTokens || 0
          if (tokensToAdd > 0) {
            await prisma.userUsage
              .upsert({
                where: { userId: session.user.id },
                create: {
                  userId: session.user.id,
                  dailyTokens: tokensToAdd,
                  totalTokens: tokensToAdd,
                  lastRequestAt: new Date(),
                },
                update: {
                  dailyTokens: { increment: tokensToAdd },
                  totalTokens: { increment: tokensToAdd },
                  lastRequestAt: new Date(),
                },
              })
              .catch((err) => console.error('[USER_USAGE_PERSIST_ERROR]', err))
          }

          // Registrar log de consumo de tokens y costos referenciales por concepto
          await recordTokenUsageLog({
            userId: session.user.id,
            conversationId: activeConvId,
            messageId: assistantMsg?.id,
            modelCode,
            provider,
            concept: TokenUsageConcept.CHAT_COMPLETION,
            promptTokens: usage?.inputTokens || 0,
            completionTokens: usage?.outputTokens || 0,
            latencyMs: totalDurationMs,
          })

          // Registrar log de auditoría
          await prisma.requestLog
            .create({
              data: {
                userId: session.user.id,
                endpoint: '/api/chat',
                method: 'POST',
                statusCode: 200,
                durationMs: totalDurationMs,
                ipAddress,
                userAgent,
              },
            })
            .catch((err) => console.error('[REQUEST_LOG_ERROR]', err))
        } catch (dbErr) {
          console.error('[DATABASE_PERSIST_ERROR]', dbErr)
        }
      },
    })

    // 11. Retornar UI Message Stream oficial de AI SDK con metadatos de fuentes RAG, modelo y conversationId
    const uiStream = toUIMessageStream({
      stream: result.stream,
      sendSources: true,
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return {
            conversationId: activeConvId,
            modelName: modelCode,
            modelProvider: provider,
            embeddingModel: 'gemini-embedding-2',
            retrievalLatencyMs,
            latencyMs: Date.now() - startTime,
            sources: sources.map((s) => ({
              chunkId: s.chunkId,
              documentId: s.documentId,
              title: s.title,
              url: s.sourceUrl,
              snippet: s.snippetText,
              relevance: s.relevance,
              embeddingModel: s.embeddingModel || 'gemini-embedding-2',
            })),
          }
        }
        if (part.type === 'finish') {
          return {
            conversationId: activeConvId,
            totalTokens: part.totalUsage.totalTokens,
            latencyMs: Date.now() - startTime,
          }
        }
      },
    })

    return createUIMessageStreamResponse({
      stream: uiStream,
      headers: {
        'x-conversation-id': activeConvId,
      },
    })
  } catch (error: any) {
    const durationMs = Date.now() - startTime
    console.error('[CHAT_API_ERROR]', error)

    await prisma.requestLog
      .create({
        data: {
          userId: session.user.id,
          endpoint: '/api/chat',
          method: 'POST',
          statusCode: 500,
          durationMs,
          ipAddress,
          userAgent,
        },
      })
      .catch(() => {})

    const userFriendlyMessage =
      error?.message?.includes('API key')
        ? 'Clave de API de Gemini no válida o expirada. Por favor verifica la configuración.'
        : 'Estamos experimentando problemas, por favor intenta nuevamente en unos instantes.'

    return new Response(JSON.stringify({ error: userFriendlyMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

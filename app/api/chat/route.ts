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
import { DEFAULT_EMBEDDING_MODEL } from '@/lib/ai/embeddings'
import { rewriteAndExpandQuery } from '@/lib/ai/query-rewriter'
import { detectResolutionStatus } from '@/lib/ai/resolution-detector'
import { prisma, ModelProvider, ResolutionStatus, TokenUsageConcept, Role, type Message } from '@/lib/prisma'
import { recordTokenUsageLog } from '@/lib/ai/token-tracker'
import {
  buildSystemPromptWithSources,
  DEFAULT_MODEL_CODE,
  DEFAULT_PROVIDER,
  MAX_QUESTIONS_PER_CONVERSATION,
  CHAT_LIMIT_MESSAGES,
} from '@/constants'

export interface ChatAttachment {
  name?: string
  type?: string
  data?: string
  base64?: string
  mediaType?: string
  filename?: string
}

export interface ChatRequestBody {
  conversationId?: string
  modelCode?: string
  provider?: ModelProvider
  isVoiceInput?: boolean
  isRegeneration?: boolean
  regeneratedFromId?: string
  parentId?: string
  messages?: UIMessage[]
  message?: string
  attachments?: ChatAttachment[]
}

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

  let body: ChatRequestBody
  try {
    body = (await req.json()) as ChatRequestBody
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
  const isRegeneration: boolean = Boolean(body.isRegeneration)
  const regeneratedFromId: string | undefined = body.regeneratedFromId
  const parentId: string | undefined = body.parentId

  // 1.2 Obtener configuración del sistema global definida por el Administrador
  const systemConfig = await prisma.systemSetting
    .findUnique({
      where: { id: 'global_config' },
    })
    .catch(() => null)

  const isMaintenanceMode = systemConfig?.maintenanceMode ?? false
  const isAdmin = session.user.role === Role.ADMIN

  // 1.3 Validación de Modo Mantenimiento (los administradores pueden acceder para supervisión y pruebas)
  if (isMaintenanceMode && !isAdmin) {
    return new Response(
      JSON.stringify({
        error:
          'El servicio de chat de SipánGPT se encuentra temporalmente en modo de mantenimiento por actualizaciones programadas. Por favor, intenta nuevamente más tarde.',
        code: 'MAINTENANCE_MODE_ACTIVE',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // 1.5 Validar límite de consultas por conversación (máximo 20 preguntas por chat)
  if (conversationId && !isRegeneration) {
    try {
      const userQuestionsCount = await prisma.message.count({
        where: {
          conversationId,
          role: 'USER',
        },
      })

      if (userQuestionsCount >= MAX_QUESTIONS_PER_CONVERSATION) {
        return new Response(
          JSON.stringify({
            error: CHAT_LIMIT_MESSAGES.DESCRIPTION,
            code: 'CONVERSATION_LIMIT_REACHED',
            currentCount: userQuestionsCount,
            maxCount: MAX_QUESTIONS_PER_CONVERSATION,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    } catch (countErr) {
      console.warn('[CHAT_COUNT_CHECK_WARN]', countErr)
    }
  }

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

  // 3. Extraer el texto de la última consulta del usuario para validaciones y búsqueda RAG
  const lastUserMsg = [...rawMessages].reverse().find((m) => m.role === 'user')
  const userText =
    lastUserMsg?.parts
      ?.filter((p) => p.type === 'text')
      .map((p) => (p as { text: string }).text)
      .join(' ')
      .trim() || ''

  const attachments: ChatAttachment[] = body.attachments || []

  if (!userText && attachments.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Debe ingresar una consulta o adjuntar un archivo.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // 3.1 Validar longitud máxima de caracteres del prompt (Política maxPromptChars)
  const maxPromptChars = systemConfig?.maxPromptChars ?? 2000
  if (userText.length > maxPromptChars) {
    return new Response(
      JSON.stringify({
        error: `Tu consulta excede el límite máximo permitido de ${maxPromptChars.toLocaleString()} caracteres (${userText.length.toLocaleString()} caracteres enviados). Por favor, resume o divide tu consulta.`,
        code: 'MAX_PROMPT_CHARS_EXCEEDED',
        maxPromptChars,
        receivedChars: userText.length,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // 3.2 Validar políticas de voz y análisis de imágenes
  const enableVoiceInput = systemConfig?.enableVoiceInput ?? true
  if (isVoiceInput && !enableVoiceInput) {
    return new Response(
      JSON.stringify({
        error:
          'La entrada por voz se encuentra temporalmente deshabilitada por el administrador.',
        code: 'VOICE_INPUT_DISABLED',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const enableImageAnalysis = systemConfig?.enableImageAnalysis ?? true
  const hasImages = attachments.some(
    (att) => att.type?.startsWith('image/') || att.mediaType?.startsWith('image/')
  )
  if (hasImages && !enableImageAnalysis) {
    return new Response(
      JSON.stringify({
        error:
          'El análisis de imágenes se encuentra temporalmente deshabilitado por el administrador.',
        code: 'IMAGE_ANALYSIS_DISABLED',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // 3.3 Validar cuota de consumo diario de tokens (Política maxDailyTokensPerUser)
  const maxDailyTokens = systemConfig?.maxDailyTokensPerUser ?? 50000
  if (!isAdmin && maxDailyTokens > 0) {
    try {
      const userUsage = await prisma.userUsage.findUnique({
        where: { userId: session.user.id },
      })

      if (userUsage) {
        const now = new Date()
        const resetAt = new Date(userUsage.resetAt)
        const isPast24h = now.getTime() - resetAt.getTime() >= 24 * 60 * 60 * 1000
        const isCalendarDayDiff =
          now.getUTCFullYear() !== resetAt.getUTCFullYear() ||
          now.getUTCMonth() !== resetAt.getUTCMonth() ||
          now.getUTCDate() !== resetAt.getUTCDate()

        if (isPast24h || isCalendarDayDiff) {
          // El ciclo diario concluyó: reiniciar contador para hoy
          await prisma.userUsage.update({
            where: { userId: session.user.id },
            data: {
              dailyTokens: 0,
              resetAt: now,
            },
          })
        } else if (userUsage.dailyTokens >= maxDailyTokens) {
          return new Response(
            JSON.stringify({
              error: `Has alcanzado tu límite diario de consumo de IA (${maxDailyTokens.toLocaleString()} tokens). Tu cuota se reiniciará automáticamente al inicio del próximo ciclo diario.`,
              code: 'DAILY_TOKEN_LIMIT_EXCEEDED',
              dailyTokens: userUsage.dailyTokens,
              maxDailyTokens,
              resetAt: userUsage.resetAt,
            }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      }
    } catch (quotaErr) {
      console.warn('[DAILY_TOKEN_CHECK_WARN]', quotaErr)
    }
  }

  try {
    // 3.5 Políticas de búsqueda y recuperación RAG
    const isRAGEnabled = systemConfig ? systemConfig.enableRAG : true
    const isWebSearchEnabled = systemConfig ? systemConfig.enableWebSearch : false
    const isMapsSearchEnabled = systemConfig ? systemConfig.enableMapsSearch : false
    const minSimScore = systemConfig?.minSimilarityScore ?? 0.50

    // 4. Pre-RAG NLU: Normalización, expansión de consulta y detección de intención institucional (Estrategias 2 y 3)
    const retrievalStartTime = Date.now()
    const ragContext = {
      userId: session.user.id,
      conversationId: conversationId || undefined,
    }
    const rewrittenQuery =
      isRAGEnabled && userText
        ? await rewriteAndExpandQuery(userText, ragContext)
        : null
    const queryForSearch = rewrittenQuery?.expandedQuery || userText
    const sources =
      isRAGEnabled && queryForSearch
        ? await searchKnowledgeBase(
            queryForSearch,
            3,
            minSimScore,
            rewrittenQuery?.inferredCategory,
            ragContext
          )
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

    // 6.5 Consultar e inyectar memorias activas del estudiante (UserMemory)
    try {
      const userMemories = await prisma.userMemory.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { fact: true },
        orderBy: { createdAt: 'asc' },
      })

      if (userMemories.length > 0) {
        systemPrompt +=
          `\n\n[MEMORIA DEL ESTUDIANTE]:\n` +
          userMemories.map((m) => `- ${m.fact}`).join('\n')
      }
    } catch (memErr) {
      console.warn('[USER_MEMORIES_FETCH_WARN]', memErr)
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
        const fileParts: Array<{ type: 'file'; data: Buffer; mediaType: string; filename?: string }> = []
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

    // Persistir mensaje del usuario inmediatamente solo si es una nueva consulta
    let createdUserMsgId: string | null = null
    if (!isRegeneration) {
      const userMsg = await prisma.message.create({
        data: {
          conversationId: activeConvId,
          role: 'USER',
          content:
            userText ||
            `[Adjunto: ${attachments.map((a) => a.name).join(', ')}]`,
          isVoiceInput,
          parentId: parentId || null,
        },
      }).catch(() => null)
      createdUserMsgId = userMsg?.id || null
    }

    const assistantParentId = createdUserMsgId || parentId || null

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
          let assistantMsg: Message | null = null
          try {
            assistantMsg = await prisma.message.create({
              data: {
                conversationId: activeConvId,
                role: 'ASSISTANT',
                content: text,
                modelUsed: modelCode,
                embeddingModel: DEFAULT_EMBEDDING_MODEL,
                promptTokens: usage?.inputTokens || 0,
                totalTokens: usage?.totalTokens || 0,
                latencyMs: totalDurationMs,
                retrievalLatencyMs,
                generationLatencyMs,
                resolutionStatus,
                categoryId: docCategoryId,
                detectedIntent: rewrittenQuery?.detectedIntent || null,
                isRegeneration,
                regeneratedFromId: regeneratedFromId || null,
                parentId: assistantParentId,
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
                  embeddingModel: s.embeddingModel || DEFAULT_EMBEDDING_MODEL,
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

          // Actualizar consumo de tokens del usuario (suma tanto consultas nuevas como regeneraciones)
          const tokensToAdd = usage?.totalTokens || 0
          if (tokensToAdd > 0) {
            const now = new Date()
            const existingUsage = await prisma.userUsage
              .findUnique({
                where: { userId: session.user.id },
              })
              .catch(() => null)

            const isPast24h = existingUsage
              ? now.getTime() - new Date(existingUsage.resetAt).getTime() >= 24 * 60 * 60 * 1000
              : false
            const isCalendarDayDiff = existingUsage
              ? now.getUTCFullYear() !== new Date(existingUsage.resetAt).getUTCFullYear() ||
                now.getUTCMonth() !== new Date(existingUsage.resetAt).getUTCMonth() ||
                now.getUTCDate() !== new Date(existingUsage.resetAt).getUTCDate()
              : false

            if (existingUsage && (isPast24h || isCalendarDayDiff)) {
              await prisma.userUsage
                .update({
                  where: { userId: session.user.id },
                  data: {
                    dailyTokens: tokensToAdd,
                    totalTokens: { increment: tokensToAdd },
                    lastRequestAt: now,
                    resetAt: now,
                  },
                })
                .catch((err) => console.error('[USER_USAGE_RESET_UPDATE_ERROR]', err))
            } else {
              await prisma.userUsage
                .upsert({
                  where: { userId: session.user.id },
                  create: {
                    userId: session.user.id,
                    dailyTokens: tokensToAdd,
                    totalTokens: tokensToAdd,
                    lastRequestAt: now,
                    resetAt: now,
                  },
                  update: {
                    dailyTokens: { increment: tokensToAdd },
                    totalTokens: { increment: tokensToAdd },
                    lastRequestAt: now,
                  },
                })
                .catch((err) => console.error('[USER_USAGE_PERSIST_ERROR]', err))
            }
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
            metadata: isRegeneration
              ? { isRegeneration: true, regeneratedFromId }
              : undefined,
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
            embeddingModel: DEFAULT_EMBEDDING_MODEL,
            retrievalLatencyMs,
            latencyMs: Date.now() - startTime,
            sources: sources.map((s) => ({
              chunkId: s.chunkId,
              documentId: s.documentId,
              title: s.title,
              url: s.sourceUrl,
              snippet: s.snippetText,
              relevance: s.relevance,
              embeddingModel: s.embeddingModel || DEFAULT_EMBEDDING_MODEL,
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
  } catch (error: unknown) {
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

    const isApiKeyError = error instanceof Error && error.message.includes('API key')
    const userFriendlyMessage = isApiKeyError
      ? 'Clave de API de Gemini no válida o expirada. Por favor verifica la configuración.'
      : 'Estamos experimentando problemas, por favor intenta nuevamente en unos instantes.'

    return new Response(JSON.stringify({ error: userFriendlyMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * DELETE /api/chat?id=<chatId>
 * Realiza el borrado lógico (soft delete / isArchived = true) de una conversación
 */
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'No autorizado. Inicie sesión.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { searchParams } = new URL(req.url)
  const chatId = searchParams.get('id')

  if (!chatId) {
    return new Response(JSON.stringify({ error: 'ID de conversación requerido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const result = await prisma.conversation.updateMany({
      where: {
        id: chatId,
        userId: session.user.id,
      },
      data: {
        isArchived: true,
      },
    })

    if (result.count === 0) {
      return new Response(
        JSON.stringify({ error: 'Conversación no encontrada o no pertenece al usuario.' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Conversación ocultada correctamente.' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('[DELETE_CHAT_ERROR]', err)
    return new Response(
      JSON.stringify({ error: 'Error interno al ocultar la conversación.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}


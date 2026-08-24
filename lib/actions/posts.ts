'use server'

import { prisma } from '@/lib/prisma'
import type { PostItem } from '@/types'

/**
 * Obtiene los posts publicados con información de autor y categoría.
 * Si la base de datos no tiene ninguna publicación registrada, auto-inicializa el comunicado de bienvenida USS.
 */
export async function getPublishedPosts(): Promise<PostItem[]> {
  try {
    const totalCount = await prisma.post.count()

    if (totalCount === 0) {
      // Solo auto-inicializar si la tabla de publicaciones está totalmente vacía
      const firstAdmin =
        (await prisma.user.findFirst({ where: { role: 'ADMIN' } })) ||
        (await prisma.user.findFirst())

      if (firstAdmin) {
        const generalCategory = await prisma.category.upsert({
          where: { slug: 'comunicados-uss' },
          create: {
            name: 'Comunicados USS',
            slug: 'comunicados-uss',
            description: 'Avisos y comunicados oficiales de la Universidad Señor de Sipán',
          },
          update: {},
        })

        await prisma.post.upsert({
          where: { slug: 'inicio-de-clases-y-guia-rag-2026' },
          create: {
            title: 'Inicio de Clases y Guía RAG de Trámites Oficiales 2026',
            slug: 'inicio-de-clases-y-guia-rag-2026',
            excerpt: 'Conoce los cronogramas académicos, proceso de matrícula y cómo usar SipánGPT para consultar los reglamentos oficiales.',
            content: `Estimada comunidad universitaria de la Universidad Señor de Sipán:

Les damos la más cordial bienvenida al nuevo ciclo académico. A través de **SipánGPT v2.0**, ahora cuentas con un asistente especializado impulsado por inteligencia artificial y recuperación de documentos RAG.

### 📌 Novedades Principales:
1. **Búsqueda Oficial:** Respuestas fundamentadas en reglamentos académicos, estatutos y directivas vigentes.
2. **Citas y Fuentes Verificables:** Cada respuesta incluye las referencias y fragmentos de donde se extrajo la información.
3. **Atención 24/7:** Consultas sobre convalidaciones, grados, títulos, pagos de pensiones y becas estudiantiles.

Para mayor información o consultas presenciales, acércate a la Dirección de Servicios Académicos en el Campus Universitario USS.`,
            status: 'PUBLISHED',
            externalUrl: 'https://www.uss.edu.pe',
            authorId: firstAdmin.id,
            categoryId: generalCategory.id,
            publishedAt: new Date(),
          },
          update: {},
        })
      }
    }

    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        author: {
          select: { name: true, email: true, image: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    })

    return posts as PostItem[]
  } catch (err) {
    console.error('[GET_PUBLISHED_POSTS_ERROR]', err)
    return []
  }
}

export async function getLatestPost(): Promise<PostItem | null> {
  const posts = await getPublishedPosts()
  return posts.length > 0 ? posts[0] : null
}

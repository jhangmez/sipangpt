import { createRouteHandler } from 'uploadthing/next'
import { ourFileRouter } from './core'

// Permitir tiempo extendido de ejecución en entornos serverless para OCR y Sipán-STAIR
export const maxDuration = 300

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
})


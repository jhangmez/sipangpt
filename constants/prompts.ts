/**
 * Prompt del Sistema Institucional Base para SipánGPT
 */
export const SIPANGPT_SYSTEM_PROMPT = `Eres SipánGPT, el asistente de inteligencia artificial oficial de la Universidad Señor de Sipán (USS).
Tu objetivo es orientar y responder con amabilidad, precisión, rigor académico, exhaustividad y profesionalismo a estudiantes, docentes, egresados y postulantes sobre trámites académicos, plataformas digitales (Campus Virtual, Aula Virtual, Sistema de Registros Académicos), carreras, reglamentos, cronogramas y servicios institucionales.

Directrices de Respuesta:
1. Comunícate en un tono formal, claro, directo y servicial; evita saludos extensos o texto de relleno y prioriza la precisión operativa.
2. Organiza tus explicaciones de forma estructurada (usando listas numeradas o viñetas) cuando se trate de procedimientos, pasos en sistemas o requisitos.
3. Si dispones de información oficial recuperada (citas RAG), fundamenta tu respuesta directamente en ella e indica el nombre del documento, reglamento o manual oficial correspondiente.
4. Si un trámite o procedimiento involucra pasos operativos en plataformas universitarias (Campus Virtual, Aula Virtual / Moodle), proporciona la guía paso a paso necesaria con amabilidad y orienta a validar en los canales oficiales de atención (informes@uss.edu.pe o Mesa de Ayuda) ante gestiones sensibles.
5. Mantén la fidelidad normativa: no inventes fechas, costos ni reglamentos que contradigan a la institución.
6. Fidelidad literal operativa: Conserva con exactitud literal (tal como aparecen en los fragmentos oficiales) los nombres de botones, menús, rutas de navegación, columnas, estados, plataformas, montos, medidas, plazos, números de artículo, casillas (marcadas o desmarcadas) y condiciones o excepciones clave, pero redacta las listas de requisitos y disposiciones normativas con tus propias palabras claras y ordenadas (sin copiar párrafos textuales palabra por palabra del PDF) para evitar cortes por filtro de recitación. Si un fragmento enumera requisitos, funciones o pasos, inclúyelos todos sin omitir ninguno ni sustituir nombres de interfaz por sinónimos genéricos. No mezcles ni combines requisitos, plazos, pagos ni pasos de dos trámites o procedimientos distintos aunque aparezcan en los mismos fragmentos recuperados: separa claramente qué corresponde a cada trámite. Nunca traslades pasos, requisitos ni plazos de un manual o trámite distinto (por ejemplo, el plazo de 48 horas o el flujo de Procesos en Línea) hacia un procedimiento regulado por un artículo normativo específico (como reembolsos del Reglamento de Cobranza). Asimismo, cuando el usuario indique en qué pantalla se encuentra actualmente (p. ej. dentro del Campus Virtual), comienza siempre por el primer clic exacto desde esa pantalla sin saltarte pasos de entrada. Cuando los fragmentos recuperados contengan procedimientos pertinentes de dos plataformas o secciones oficiales distintas para la consulta (por ejemplo, Campus Virtual y Aula Virtual / AULAUSS para acceso docente a asignaturas, o Detalle Económico y Verificar el Servicio Cancelado / Cronograma para validar un pago), incluye claramente ambas rutas diferenciadas sin omitir ninguna. Reduce saludos o texto de relleno y prioriza la precisión operativa.`

/**
 * Helper para construir el System Prompt enriquecido con fragmentos RAG y metadatos de negocio
 */
export function buildSystemPromptWithSources(
  sources: Array<{
    title: string
    pageNumber?: number | null
    snippetText: string
    categoria?: string | null
    anioVigencia?: number | null
    breadcrumb?: string | null
    capitulo?: string | null
    articulo?: string | null
  }>
): string {
  if (sources.length === 0) {
    return SIPANGPT_SYSTEM_PROMPT
  }

  const formattedSources = sources
    .map((s, idx) => {
      const metaParts: string[] = []
      if (s.categoria) metaParts.push(`Categoría: ${s.categoria}`)
      if (s.anioVigencia) metaParts.push(`Vigencia: ${s.anioVigencia}`)
      if (s.pageNumber) metaParts.push(`Pág. ${s.pageNumber}`)
      const metaSuffix = metaParts.length > 0 ? ` | ${metaParts.join(' | ')}` : ''

      const sourceHeader = s.breadcrumb || s.title

      return `[Fuente ${idx + 1}: ${sourceHeader}${metaSuffix}]\n${s.snippetText}`
    })
    .join('\n\n')

  return `${SIPANGPT_SYSTEM_PROMPT}

--- INFORMACIÓN OFICIAL VERIFICADA DE LA UNIVERSIDAD SEÑOR DE SIPÁN (RAG) ---
${formattedSources}

Instrucción: Utiliza de manera prioritaria la información oficial anterior para formular tu respuesta de forma completa, directa y precisa. Conserva con exactitud literal los nombres de botones, menús, rutas, columnas, estados, montos, medidas, plazos, números de artículo, casillas y condiciones o excepciones clave, pero redacta las listas de requisitos y disposiciones normativas con tus propias palabras claras y ordenadas (sin copiar párrafos textuales palabra por palabra del PDF) para evitar cortes por filtro de recitación. Si un fragmento enumera requisitos, funciones o pasos, inclúyelos todos sin omitir ninguno ni sustituir nombres de interfaz por sinónimos genéricos. No mezcles ni combines requisitos, plazos, pagos ni pasos de dos trámites o procedimientos distintos; diferencia claramente qué regla o paso aplica a cada trámite. Nunca traslades pasos, requisitos ni plazos de un manual o trámite distinto (por ejemplo, el plazo de 48 horas o el flujo de Procesos en Línea) hacia un procedimiento regulado por un artículo normativo específico (como reembolsos del Reglamento de Cobranza). Asimismo, cuando el usuario indique en qué pantalla se encuentra actualmente (p. ej. dentro del Campus Virtual), comienza siempre por el primer clic exacto desde esa pantalla sin saltarte pasos de entrada. Cuando los fragmentos recuperados contengan procedimientos pertinentes de dos plataformas o secciones oficiales distintas para la consulta (por ejemplo, Campus Virtual y Aula Virtual / AULAUSS para acceso docente a asignaturas, o Detalle Económico y Verificar el Servicio Cancelado / Cronograma para validar un pago), incluye claramente ambas rutas diferenciadas sin omitir ninguna. Cita con precisión el nombre del reglamento, manual, capítulo o número de artículo correspondiente cuando aplique (ej. «Conforme al Reglamento General de Matrícula, Capítulo II, Artículo 17...»). Reduce saludos/relleno y prioriza precisión operativa. Cuando existan reglamentos de diferentes años, prioriza siempre el de mayor vigencia temporal.`
}

/**
 * Prompts estrictos de transcripción OCR multimodal para Sipán-STAIR (cero resúmenes/omisiones)
 */
export const DOCUMENT_OCR_TRANSCRIPTION_PROMPT = `Transcribe de manera ÍNTEGRA, LITERAL y EXHAUSTIVA el 100% del contenido de TODAS las páginas de este documento de la Universidad Señor de Sipán (USS) a formato Markdown (.md) para indexación Sipán-STAIR.

REGLAS ESTRICTAS DE TRANSCRIPCIÓN INTEGRAL (OBLIGATORIAS):
1. PROHIBIDO RESUMIR U OMITIR CONTENIDO: NUNCA abrevies, sintetices, selecciones ejemplos parciales ni escribas notas como "(Extracto)", "Debido a la extensión...", "se resumen las tablas principales", "por brevedad", "el documento incluye tablas detalladas..." o "etc.".
2. TABLAS, TARIFARIOS Y ANEXOS AL 100%: Si el documento contiene tarifarios, escalas de pensiones, uniformes, tasas administrativas, cronogramas, mallas curriculares o anexos, transcribe ABSOLUTAMENTE TODAS las filas y TODAS las columnas de CADA tabla en formato Markdown GFM, conservando los importes exactos sin agruparlos en rangos ni omitir filas. Si una tabla continúa en otra página, repite sus encabezados de columna y sigue transcribiendo fila por fila hasta terminar.
3. ARTÍCULOS Y PROCEDIMIENTOS COMPLETOS: No cortes ni parafrasees artículos normativos, incisos, literales, excepciones, rutas de menús, nombres de botones, columnas o estados. Transcribe el texto completo literalmente.
4. ESTRUCTURA JERÁRQUICA CANÓNICA:
   - Nivel 1 (# TÍTULO ...) para Títulos mayores o denominación principal del documento/reglamento.
   - Nivel 2 (## CAPÍTULO ... o ## TARIFARIO / ## ANEXO ...) para capítulos y secciones principales.
   - Nivel 3 (### ARTÍCULO ... o ### Subtítulo de tabla/sección) para artículos individuales y subtablas.
5. MARCADORES DE PÁGINA Y PORTADA: Incluye separadores exactos "--- Página X ---" por cada página. Si existe un Índice o Tabla de Contenidos, transcríbelo completo; no agregues preámbulos conversacionales ni comentarios propios antes ni después del documento.
6. CAPTURAS DE PANTALLA E INTERFACES GRÁFICAS: Por cada captura de pantalla, formulario o imagen de interfaz visible en el PDF, incluye inmediatamente debajo un bloque literal titulado [Captura de pantalla - Interfaz] transcribiendo de forma exhaustiva todos los elementos visibles sin resumir ni parafrasear:
   - Precisión espacial real y buscador principal: indica con exactitud la ubicación espacial de cada elemento (parte superior o inferior; izquierda, centro o derecha), tomando en cuenta el menú lateral si existe para distinguir claramente menú lateral, panel central y panel derecho. Prioriza siempre la barra principal de búsqueda de contenidos sobre filtros secundarios.
   - Entornos de prueba / pasarelas de pago: NO transcribas como parte del flujo oficial nombres de comercios/logos de ejemplo o encabezados de prueba que aparezcan en capturas demo de pasarelas de pago; descríbelos de forma neutra como "ventana modal de la pasarela de pagos".
   - Título exacto de la ventana, formulario o módulo (ej. "Campus Universitario", "INFORME ECONÓMICO DEL CURSO").
   - Texto literal, color y estado de botones y enlaces de acción (ej. botón morado «Yapear», botón azul «Plinear», «VER SECCIONES», «Vista Previa», «Confirmar Matrícula», «Editar Matrícula»), así como pestañas y barras de búsqueda o botones auxiliares (ej. barra «Buscar en libros», botón «Recomendaciones»).
   - Campos numerados y etiquetas visibles (ej. Campo #1 / Usuario #2 / Contraseña #1), filtros de año/mes/período, puntajes de rúbrica y estados o etiquetas visibles («CANCELADO», «AUTORIZADO», «Listo para usar», etc.).
   - Encabezados, nombres literales de columnas (ej. Total_Mora, Total_Pnd, Total_Can) y filas de cualquier tabla mostrada dentro de la captura.
   - Iconos relevantes de acción o navegación visibles (lupa, impresora, descarga, calendario, edición, etc.).
   - Casillas de verificación (checkboxes) y botones de opción indicando explícitamente cuáles están marcados [x] y cuáles aparecen desmarcados [ ] junto con su texto literal.`

export const DOCUMENT_OCR_CONTINUATION_PROMPT = `Continúa transcribiendo el documento EXACTAMENTE desde la última línea/fila donde te detuviste, sin repetir lo anterior y SIN RESUMIR NI OMITIR ninguna página, artículo ni fila de tabla hasta completar la última página del PDF.`

export const DOCUMENT_OCR_ANTI_LAZINESS_RETRY_PROMPT = `ATENCIÓN: Tu respuesta anterior resumió, abrevió u omitió secciones, tablas o bloques visuales (por ejemplo escribiendo "(Extracto)", "Debido a la extensión..." o dejando páginas/tablas/capturas incompletas).
Esto rompe la base de conocimientos normativa. Transcribe ahora DE FORMA ÍNTEGRA Y LITERAL, fila por fila y artículo por artículo, el 100% de todas las tablas, tarifarios, escalas, anexos, páginas y bloques [Captura de pantalla - Interfaz] (incluyendo botones, colores, columnas, estados y casillas [x]/[ ]) que fueron resumidos o faltantes, usando tablas Markdown GFM completas sin omitir ni agrupar ningún registro.`

export const DOCUMENT_OCR_RECITATION_FALLBACK_PROMPT = `El PDF adjunto es un manual o documento normativo institucional propio de la Universidad Señor de Sipán (USS). Transfórmalo en una guía operativa técnica completa y estructurada en formato Markdown (.md) de TODAS las páginas para indexación RAG Sipán-STAIR, evitando copiar párrafos narrativos extensos palabra por palabra (para prevenir falsos positivos del filtro anti-recitación), PERO conservando al 100% la totalidad de la información factual y literal de interfaz.

REGLAS OBLIGATORIAS DE EXTRACCIÓN ESTRUCTURADA:
1. REFORMULACIÓN DE PROSA NARRATIVA (SOLO PÁRRAFOS EXPLICATIVOS): Redacta introducciones, objetivos y explicaciones generales en formato de guía paso a paso, listas numeradas o viñetas técnicas claras con redacción propia sin omitir ningún dato, condición, enlace ni excepción.
2. EXACTITUD LITERAL OBLIGATORIA EN INTERFAZ Y DATOS CRÍTICOS: Mantén TEXTUALMENTE SIN CAMBIAR NI UNA PALABRA:
   - Nombres exactos de plataformas, módulos, URLs, rutas de navegación, pestañas, menús, botones (con su color y texto literal), campos numerados, filtros, encabezados y columnas de tablas, estados visibles, íconos y casillas de verificación ([x] marcadas vs. [ ] desmarcadas).
   - Montos, fechas, plazos, porcentajes, códigos, artículos, requisitos y excepciones.
3. BLOQUES [Captura de pantalla - Interfaz]: Por cada captura o pantalla mostrada en el PDF, inserta inmediatamente debajo un bloque literal titulado [Captura de pantalla - Interfaz] detallando título de ventana/módulo, botones y colores, pestañas, campos, filtros, columnas/tablas, estados, íconos y casillas [x]/[ ]. Describe con precisión espacial real (parte superior/inferior, izquierda/centro/derecha, diferenciando menú lateral, panel central y panel derecho), prioriza la barra principal de búsqueda sobre filtros secundarios y evita transcribir logos o nombres de comercio demo/prueba en pasarelas de pago (descríbelos como "ventana modal de la pasarela de pagos").
4. TABLAS Y ESTRUCTURA JERÁRQUICA COMPLETA: Incluye marcadores exactos "--- Página X ---" por cada página, encabezados Markdown jerárquicos (#, ##, ###) y tablas Markdown GFM completas al 100%. Prohibido resumir, omitir páginas o escribir "(Extracto)".`

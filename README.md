# SipánGPT • Asistente Virtual Universitario con IA & RAG Institucional

<div align="center">

![SipánGPT Portada y Chat Interface](./public/imagenes/IMAGEN_SIPANGPT_CHAT_25082026.png)

[![Next.js](https://img.shields.io/badge/Next.js_16.3_(Turbopack)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK_7.x-000000?style=for-the-badge&logo=vercel)](https://ai-sdk.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_3.1_%26_3.6-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Prisma](https://img.shields.io/badge/Prisma_7.9-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Neon Database](https://img.shields.io/badge/Neon_PostgreSQL_(pgvector)-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker_22_Alpine-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD_GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions)](https://github.com/features/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 🌟 Descripción General

**SipánGPT** es una plataforma integral de asistencia conversacional con Inteligencia Artificial Generativa diseñada a la medida para la **Universidad Señor de Sipán (USS)**. Permite a estudiantes, docentes, postulantes y personal administrativo resolver consultas sobre procesos de matrícula, trámites de grados y títulos, directivas académicas, calendarios de pagos, convalidaciones y servicios universitarios con respuestas oficiales, fidedignas y fundamentadas en la normativa institucional vigente.

La plataforma incorpora una arquitectura **RAG (Retrieval-Augmented Generation) de Alta Fidelidad** basada en el paradigma **STAIR** (*Structure-Aware Indexing and Retrieval*), conectada a una base de datos vectorial en PostgreSQL (Neon) con extensión `pgvector`. Incluye renderizado avanzado de fórmulas matemáticas y diagramas, soporte para modelos en la nube y locales (Mac Mini M4 vía Cloudflare Tunnel), personalización mediante **Memorias de Usuario**, un **Inspector Forense de Conversaciones**, gobernanza activa de políticas administrativas, auditoría de costos por token en tiempo real, soporte para pruebas de carga mediante **API Key interna**, y un pipeline automatizado de despliegue continuo con **Docker y GitHub Actions**.

---

## 🚀 Características Principales

### 1. 💬 Experiencia de Chat Conversacional Avanzada
- **Streaming de Texto en Tiempo Real:** Implementado con **Vercel AI SDK 7.x** (`streamText`, `createUIMessageStreamResponse`, `toUIMessageStream`) y decodificación reactiva de paquetes SSE (`text-delta`, `reasoning-delta`).
- **Ventana de Generación Ampliada y Pensamiento Configurable:** Salida de hasta **4,096 tokens por respuesta** (`6,144` tokens en Gemini 3+), selector de nivel de razonamiento (`ThinkingLevel`: `low`, `medium`, `high`) y condensación contextual multiturno en `rewriteAndExpandQuery`.
- **Límite Preventivo por Conversación:** Control automático que limita a un máximo de **20 consultas de usuario por chat** para prevenir la degradación de contexto y orientar al usuario a iniciar una nueva sesión focalizada.
- **Persistencia y Continuidad de Sesión:** Creación de conversaciones por adelantado, sincronización dinámica de URLs (`/chat/[id]`), regeneración y branching de respuestas alternativas con trazabilidad de mensajes padre/hijo.
- **Renderizador Markdown Shadcn de Alta Precisión (`shadcn-markdown`):**
  - 📐 **Fórmulas Matemáticas:** Renderizado LaTeX inline (`$E=mc^2$`) y en bloque con KaTeX.
  - 💻 **Bloques de Código:** Resaltador de sintaxis Prism (`vscDarkPlus`), formateo JSON automático y botón interactivo para **Copiar Código**.
  - 📊 **Diagramas de Flujo Mermaid:** Renderizador SVG dinámico para diagramas de flujo y secuencias (`flowchart`, `graph TD`).
  - 📑 **Tablas GFM Responsivas:** Formateo adaptativo con desplazamiento horizontal suave.
- **Sistema de Feedback y Calificación:** Puntuación de mensajes (1 a 5 estrellas) con modales interactivos de auditoría de calidad académica.
- **Entrada de Voz y Adjuntos Multimodales:** Grabación de notas de voz con transcripción automática y análisis visual de capturas o documentos PDF.
- **Transparencia en la Interfaz de Usuario:** Notificaciones y alertas contextuales directas del servidor (modo mantenimiento, límite de caracteres o cuota de tokens alcanzada).

---

### 2. 🏛️ Arquitectura "Sipán-STAIR" (Structure-Aware Indexing and Retrieval) & Pipeline RAG
Para la recuperación de normativas universitarias y reglamentos oficiales de la USS, SipánGPT implementa la metodología **STAIR** (*Structure-Aware Indexing and Retrieval*), adaptada para superar las limitaciones de los sistemas RAG convencionales basados en ventanas ciegas de texto:

```mermaid
graph TD
    subgraph INGESTA_DUAL ["📥 1. Ingesta Dual / Snapshot Portátil"]
        A1["📂 Archivo Local (Drag & Drop / Explorar)"] --> P["⚡ Pre-procesamiento de Archivo"]
        A2["🔗 Enlace Web / URL (Portal USS / SUNEDU)"] --> P
        A3["📦 Snapshot RAG (.json.gz Float32 Base64)"] -. Importación por lotes .-> F
    end

    P --> B["🤖 2. OCR Multimodal gemini-4-hydrogen (medium) + Cascada Anti-RECITATION"]
    B --> C["🌳 3. Extractor de Árbol ToC Canónico (Reglamentos + Manuales)"]
    C --> D["✂️ 4. Chunking Estructural Sipán-STAIR + [Captura de pantalla - Interfaz]"]
    D --> E["📐 5. Generación de Embeddings Vectoriales (gemini-embedding-2, 3072d)"]
    E --> F["🗄️ 6. Indexación en Neon PostgreSQL (Document.tocTree + DocumentChunk)"]
    F --> M["⚡ Índice Vectorial L2 en Caché RAM (globalThis Float32Array)"]

    subgraph CONSULTA ["🧑‍🎓 7. Recuperación Híbrida en Dos Etapas (RRF + ToC + Vecinos)"]
        Q["❓ Consulta + Condensación Multiturno"] --> R1["🌳 Etapa 1: Poda de Árbol ToC en Memoria (routeQueryToToCBranches)"]
        R1 --> R2["🎯 Etapa 2A/2B: RRF Híbrido (Coseno 100% + BM25) · Top 8 + Diversidad"]
        M --> R2
        R2 --> R3["🔗 Expansión Simétrica de Vecinos Contiguos (chunkIndex ± 1, ≤ 6,500 chars)"]
        R3 --> CIT["📌 8. Generación con Fidelidad Literal y Enlace Oficial (publicUrl)"]
    end
```

#### Pilares Metodológicos y Mejoras Recientes de Sipán-STAIR:
1. **🌳 Extracción y Persistencia del Árbol ToC (`Document.tocTree`):**
   - Construye una representación jerárquica canónica tanto para reglamentos (`Títulos > Capítulos > Artículos`) como para manuales (`Secciones ## / ###`), activando solapamiento real (~250 caracteres) cuando una sección extensa se subdivide.
   - Almacenado como estructura `JSONB` en PostgreSQL y cacheado en RAM junto con los fragmentos para permitir podas ultrarrápidas sin consultas redundantes por petición.
2. **🤖 Motor OCR Multimodal `gemini-4-hydrogen` (`thinkingLevel: 'medium'`):**
   - Transcribe íntegramente tablas, artículos y bloques `[Captura de pantalla - Interfaz]` (precisión espacial, botones con color, pestañas, campos numerados y casillas `[x]`/`[ ]`).
   - Incluye cascada automática de respaldo (`gemini-3.5-flash`, `gemini-3.1-flash-lite`), reintento anti-pereza y prompt estructural anti-`RECITATION`, garantizando transcripciones completas auditadas contra el PDF original (regla de cero fabricación).
3. **⚡ Índice Vectorial L2 en Caché RAM (`globalThis.__sipanRagCacheStore`):**
   - Precarga y normaliza en `Float32Array` los vectores del **100 % de los chunks activos (`INDEXED`)** filtrando carátulas y resoluciones de aprobación administrativas salvo consulta explícita (`RAG_APPROVAL_RESOLUTION_PENALTY = 0.22`), con patrón *single-flight*, TTL de 5 min, validación de versión cada 60 s e invalidación inmediata vía `invalidateRagCache()`.
4. **🎯 Fusión Híbrida RRF, Reranker con Diversidad y Expansión Contigua (`Top 8`):**
   - Combina el **100 % de la similitud coseno en RAM** con ranking léxico **BM25** mediante *Reciprocal Rank Fusion (RRF)* (`RAG_INITIAL_CANDIDATES = 25`), entregando hasta **8 fragmentos (`DEFAULT_RAG_TOP_K = 8`)**.
   - Incorpora boost para tarifarios/montos reales (`RAG_COST_TABLE_BOOST = 0.11`), límite de diversidad de **máx. 3 fragmentos por documento** (`RAG_MAX_CHUNKS_PER_DOC = 3` con umbral `>= 0.58` para consultas operativas) y **expansión simétrica de vecinos contiguos** (`chunkIndex ± 1`, hasta `6,500` caracteres en `RAG_MAX_MERGED_CHUNK_CHARS`).
5. **📌 Fidelidad Literal y Citas Oficiales con Enlace Institucional:**
   - Exige conservar textualmente botones, rutas, columnas, estados y casillas, prohíbe contaminar pasos entre trámites distintos y enlaza al documento oficial (`publicUrl` o `fileUrl`).

---

### 3. 🧠 Personalización Contextual con Memorias de Usuario (`UserMemory`)
- Los estudiantes y docentes pueden gestionar en `/configuraciones/memorias` hechos y preferencias sobre su perfil académico (ej. *"Estudio Ingeniería de Sistemas en Sede Chiclayo"*, *"Curso el 6to ciclo"*).
- **Inyección Automática en el Prompt:** En cada consulta, el sistema recupera las memorias activas del usuario (`isActive: true`) y las inyecta en el prompt del sistema (`[MEMORIA DEL ESTUDIANTE]`), adaptando respuestas y normativas al contexto del alumno sin necesidad de reiterarlo en cada mensaje.

---

### 4. 🛡️ Gobernanza Activa y Políticas de `SystemSetting` en Tiempo Real
El administrador regula la plataforma desde `/admin/settings`, aplicándose de forma determinista y preventiva en el endpoint [`/api/chat`](file:///f:/TRABAJOS/HARKAY/LANDING-PAGE/sipangpt/app/api/chat/route.ts):

| Política | Configuración | Comportamiento en Chat |
| :--- | :--- | :--- |
| **`maintenanceMode`** | Toggle on/off | Bloquea inmediatamente el chat con código **HTTP 503** para usuarios y estudiantes, permitiendo el ingreso exclusivo a administradores (`Role.ADMIN`). |
| **`maxPromptChars`** | Límite numérico (ej. 2,000) | Rechaza consultas que excedan el límite (**HTTP 400**) **antes** de procesar RAG o embeddings, previniendo sobrecostos. |
| **`maxDailyTokensPerUser`** | Límite diario de tokens | Bloquea consultas si el usuario superó su cuota diaria (**HTTP 429**). Incluye **rollover diario automático** a las 24 horas y sincronización dinámica con la página de consumo del estudiante. |
| **`enableVoiceInput`** | Toggle on/off | Habilita o deshabilita la entrada por notas de voz. |
| **`enableImageAnalysis`** | Toggle on/off | Permite o deniega el procesamiento multimodal de imágenes adjuntas. |
| **`minSimilarityScore`** | Slider (0.20 a 0.85) | Umbral de similitud coseno mínimo para aceptar fuentes citadas. |
| **`enableWebSearch` / `enableMapsSearch`** | Toggles on/off | Restricciones deterministas inyectadas en el prompt para evitar alucinaciones externas al campus USS. |

---

### 5. 📑 Ingesta Dual, Paginación y Edición de Documentos (`/admin/documents`)
- **Ingesta Dual de Documentos (Archivos Locales & Enlaces Web Oficiales):**
  - **📂 Modo Archivos Locales:** Carga rápida multiarchivo mediante UploadThing y componentes `Attachment` de Shadcn UI (PDF, TXT y Markdown hasta 16 MB).
  - **🔗 Modo Importar desde Enlace / URL:** Ingesta directa ingresando la URL pública de un reglamento institucional (ej. portal de transparencia de la USS o repositorio institucional).
  - **Preservación de `publicUrl`:** El enlace proporcionado se guarda permanentemente como la URL pública oficial del documento y se utiliza en las citas del chat para abrir la fuente original.
- **Motor OCR de Alta Capacidad para Documentos Extensos:**
  - **65,536 Tokens de Salida:** Capacidad ampliada en 8x para transcribir íntegramente compendios densos de 80 a 120 páginas en una sola pasada.
  - **Bucle de Continuación Multi-Turno Automática:** Ante compendios masivos (> 150 páginas), si la API reporta `finishReason: MAX_TOKENS`, el sistema envía solicitudes consecutivas de continuación hasta alcanzar `finishReason: STOP`, garantizando **0% de pérdida de artículos o tablas**.
- **Paginación Interactiva de Documentos:**
  - Control de visualización por páginas (10, 20 o 50 reglamentos por página) con navegación primera/anterior/siguiente/última y salto rápido de página.
- **Visualizador Avanzado con Pestaña ToC y Visor PDF Embebido:**
  - Panel lateral interactivo (`DocumentPreviewSheet`) con visualización del árbol jerárquico ToC, inspección de fragmentos y visualizador PDF embebido mediante `<iframe>` sobre `fileUrl`.
- **Editor de Chunks RAG con Preservación de Metadatos:**
  - Buscador textual interno dentro de los fragmentos del documento.
  - Edición en línea de texto y metadatos jerárquicos preservando datos contextuales previos (`prevMeta`).
  - Creación manual de nuevos fragmentos heredando categoría y año de vigencia.
  - Contador de citas realizadas por la IA por cada fragmento.
- **Re-procesamiento OCR e Ingesta Sin Eliminar Registros:**
  - Botón contextual para re-ejecutar el pipeline completo OCR (`gemini-4-hydrogen`) + ToC + embeddings desde el catálogo manteniendo el registro documental, URL pública y citas históricas (preservando el estado `INDEXED` previo si ocurre un fallo).
- **Exportación e Importación Portátil de Snapshots RAG (`.json.gz`):**
  - Empaquetado compacto (`Float32` Base64 + compresión GZIP) de categorías, documentos, árboles `tocTree` y fragmentos con sus embeddings de `3072` dimensiones desde `/admin/documents` (`GET /api/admin/documents/export`).
  - Importación guiada por lotes de **40 fragmentos** (`POST /api/admin/documents/import`) en modos **Reemplazar todo** (limpieza total de documentos/chunks preservando chats, usuarios y configuraciones) o **Combinar / Actualizar**, tolerante a límites de proxy y **sin re-ejecutar OCR ni recalcular embeddings en producción**.
- **Limpieza Automática en Storage al Eliminar:**
  - Al borrar un reglamento desde el panel de administración, el sistema elimina los registros en PostgreSQL y ejecuta la eliminación remota del archivo binario en la CDN de **UploadThing** vía `UTApi.deleteFiles`.

---

### 6. 🔍 Inspector Forense de Conversaciones y Analítica (`/admin/conversations`)
Módulo especializado para la auditoría técnica y pedagógica de las consultas de los estudiantes:
- **Trazabilidad Completa de Inferencia y Latencias:**
  - Desglose de **Latencia Total (`latencyMs`)**, **Latencia de Recuperación RAG (`retrievalLatencyMs`)** y **Latencia de Generación LLM (`generationLatencyMs`)**.
  - Conteo exacto de tokens de entrada (`promptTokens`) y tokens totales consumidos.
- **Auditoría de Citas y Fuentes Oficiales:**
  - Inspección de cada fragmento citado en la respuesta, visualizando el título del documento, enlace oficial (`sourceUrl`), número de página, score de similitud y el texto exacto recuperado (`snippetText`).
- **Estados Analíticos de Resolución (`ResolutionStatus`):**
  - Clasificación automática de cada respuesta: `RESOLVED_WITH_SOURCES` (éxito RAG con citas), `RESOLVED_GENERAL` (saludo/general sin RAG), `NO_CONTEXT_FOUND` (gap de conocimiento sin documentos afines), `UNRESOLVED_BY_FALLBACK` (frase de contingencia) y estados de feedback (`POSITIVE_FEEDBACK`, `NEGATIVE_FEEDBACK`).
- **Historial de Regeneraciones y Árbol de Mensajes:** Visualización de versiones alternativas generadas por el asistente y navegación en árbol (`parentId`).

---

### 7. 🤖 Auditoría de Tokens, Costos y Monitor de Modelos (`/admin/models`)
- **Catálogo Multimodelo en la Nube y Locales:** Gemini 3.1 Flash-Lite (por defecto), Gemini 3.6 Flash, Gemini 3.5 Flash, Gemini 3.1 Pro Preview, Gemini 2.5 Pro, GPT-4o Mini, Claude 3.5 Sonnet, Groq Llama 3.3 70B y servidor local Mac Mini M4 vía Cloudflare Tunnel.
- **Paginación y Filtros Interactivos:**
  - Paginación dinámica configurable para el catálogo de modelos y el historial de registros de tokens (`TokenUsageLog`).
  - Filtros avanzados por estado operativo (Activos / Inactivos), búsqueda reactiva por nombre de modelo y ordenamiento multidimensional (precios más altos/bajos de entrada y salida).
- **Telemetría y Validación Real de Estado de Salud:**
  - Diagnóstico dinámico de conectividad y latencia real (`ping`) para proveedores en la nube y servidores locales (Mac Mini M4 vía Cloudflare Tunnel), garantizando métricas operativas fidedignas sin estados estáticos ficticios.
- **🪙 Auditoría Completa de Consumo por Concepto (`TokenUsageLog`):**
  - `CHAT_COMPLETION`: Respuestas conversacionales del asistente.
  - `DOCUMENT_OCR_TRANSCRIPTION`: Transcripción multimodal de PDFs a Markdown.
  - `RAG_EMBEDDING`: Generación de vectores de consulta e ingesta documental masiva (`generateEmbeddingWithUsage`).
  - `QUERY_ANALYSIS`: Clasificación semántica de intención y enrutamiento con Gemini Flash-Lite.
- **Resiliencia Numérica y Relacional en Base de Datos:**
  - Sanitización estricta contra valores `NaN` o indefinidos en conteos de tokens y cálculo de costos en USD.
  - Inserciones relacionales seguras en Prisma Client 7 compatibles con conexiones opcionales de usuario y conversación.
- **Tarifas y Precios Referenciales (USD / 1M Tokens):** Precios configurables por millón de tokens de entrada (Prompt) y salida (Completion) para estimación de costos en tiempo real.
- **Monitor de Salud en Tiempo Real:** Estados `ONLINE`, `DEGRADED`, `OFFLINE` y `DISABLED`.

---

### 8. ⚡ Suite de Pruebas de Carga y Rendimiento (Performance Testing)
Para evaluar la plataforma bajo condiciones extremas de concurrencia y estrés:
- **Autenticación Dual sin Cookies (Pre-Shared Internal API Key):**
  - Admite peticiones autenticadas vía cabeceras HTTP:
    ```http
    x-api-key: <INTERNAL_API_KEY>
    ```
    o
    ```http
    Authorization: Bearer <INTERNAL_API_KEY>
    ```
  - Vinculación automática a un usuario de pruebas sintético (`benchmark-agent@sipangpt.local`) con rol `ADMIN` que puede operar aun durante el modo mantenimiento.
- **Prevención de Colisiones de IDs y Errores P2002:**
  - Manejo resiliente de inserciones en `Message` mediante `upsert` seguro y fallback automático a IDs generados por CUID cuando se envían cargas concurrentes.
- **Resiliencia del Pool de Conexiones Neon PostgreSQL:**
  - Reutilización del pool de conexiones PostgreSQL en `globalThis.pool` con control de clientes inactivos (`pool.on('error')`) y límite configurable (`PG_POOL_MAX`).
  - Documentación detallada con ejemplos en cURL, Python y scripts de estrés en [`docs/PERFORMANCE_TESTING.md`](./docs/PERFORMANCE_TESTING.md).

---

### 9. 📜 Portal Legal, Landing Institucional y Navegación Dinámica
- **Header y Barra de Navegación Minimalista (`components/shared/navbar.tsx`):**
  - **Experiencia de 2 Botones en Sesión:** Cuando el usuario está autenticado, la barra superior se reduce a dos elementos limpios: botón destacado *"Ir al Chat"* y el botón de perfil (*Avatar + ChevronDown*).
  - **Menú de Usuario Desplegable (`UserButton`):** Agrupa la identidad del usuario en la parte superior (nombre, correo institucional con copiado al portapapeles, rol `ADMIN`), accesos rápidos al chatbot y panel de control, alternador de modo noche/claro y cierre de sesión seguro.
  - **Alternador de Tema Inteligente (`ThemeToggle`):** Ubicado visiblemente a la izquierda de "Iniciar Sesión" para visitantes sin sesión, y ocultado dinámicamente de la barra principal para integrarse dentro del menú de usuario al autenticarse.
- **Página de Términos y Privacidad (`/terms`):** Marco regulatorio integral que detalla el tratamiento de datos personales, políticas de privacidad, alcance académico de la IA y descargos de responsabilidad institucional.
- **Página de Acceso Centralizada (`/login`):** Interfaz full-screen optimizada con soporte para Google OAuth, autenticación con credenciales y redirección inteligente según roles (`ADMIN` / `USER`).
- **Footer Institucional Interactivo (`components/landing/footer.tsx`):** Pie de página con efectos animados ondulantes (`@keyframes wave`) sobre la marca `SipánGPT` y créditos de autoría, enlaces oficiales al portal de la [Universidad Señor de Sipán](https://www.uss.edu.pe) y perfil profesional de [Jhan Gómez](https://www.linkedin.com/in/jhangomez).

---

### 10. 🐳 Despliegue en Producción y DevOps (Docker & CI/CD)
- **Contenedorización Optimizada:** Dockerfile multi-etapa sobre `node:22-alpine` estructurado en etapas `deps`, `builder` y `runner`, con compilación standalone de Next.js (`output: 'standalone'`).
- **Pipeline de Despliegue Continuo (GitHub Actions):**
  - Flujo automatizado en `.github/workflows/deploy.yml` que se activa en ramas principales (`feature/V2`, `main`) y tags de versión (`v*.*.*`).
  - Compilación y publicación automática de imágenes en **GitHub Container Registry (GHCR)** (`ghcr.io/jhangmez/sipangpt`).
  - Despliegue automático vía SSH en servidor VPS: descarga de contenedor, verificación de salud de la base de datos con `pg_isready`, creación automática de la extensión `pgvector` (`CREATE EXTENSION IF NOT EXISTS vector;`) y sincronización del esquema con Prisma.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Framework Fullstack** | [Next.js 16.3 (App Router, Turbopack, Server Actions, Standalone)](https://nextjs.org/) |
| **Entorno de Ejecución**| [Node.js 22 LTS](https://nodejs.org/) (Alpine Linux en contenedor) |
| **Lenguaje** | [TypeScript 5.x](https://www.typescriptlang.org/) |
| **Diseño y Estilos** | [Tailwind CSS v4](https://tailwindcss.com/), Base UI, [Shadcn UI](https://ui.shadcn.com/) |
| **Tipografías** | **Exo 2** (`--font-exo`) y **Fraunces** (`--font-frances`) locales variables |
| **Motor de IA & Streaming** | [Vercel AI SDK 7.x](https://ai-sdk.dev/), [Google Generative AI](https://ai.google.dev/) (Gemini 3.1 / 3.6 / 2.5) |
| **Base de Datos & ORM** | [Neon Serverless PostgreSQL](https://neon.tech/) con `pgvector`, [Prisma ORM 7.9](https://www.prisma.io/) (`@prisma/adapter-pg`, `@prisma/client`) |
| **Almacenamiento CDN** | [UploadThing](https://uploadthing.com/) (`@uploadthing/react`, `UTApi`) |
| **Autenticación** | NextAuth.js v5 Beta (`@auth/prisma-adapter`, Google OAuth, JWT, Roles) |
| **Renderizado Markdown** | `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `react-syntax-highlighter`, KaTeX |
| **Contenedores & CI/CD** | [Docker](https://www.docker.com/), Docker Compose, [GitHub Actions](https://github.com/features/actions), GHCR |
| **Notificaciones** | [Sonner Toast](https://sonner.emilkowal.ski/), [Lucide Icons](https://lucide.dev/) |

---

## 💻 Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/jhangmez/sipangpt.git
cd sipangpt
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno (`.env`)
Crea un archivo `.env` en la raíz del proyecto tomando como referencia las siguientes variables:

```env
# ==========================================
# Base de Datos (Neon PostgreSQL + pgvector)
# ==========================================
DATABASE_URL="postgresql://usuario:password@ep-pooler.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://usuario:password@ep-direct.aws.neon.tech/neondb?sslmode=require"
PG_POOL_MAX=20

# ==========================================
# Autenticación (NextAuth.js v5)
# ==========================================
AUTH_SECRET="tu_secreto_super_seguro_minimo_32_caracteres"
AUTH_GOOGLE_ID="tu_google_client_id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-tu_google_client_secret"
NEXTAUTH_URL="http://localhost:3000"

# ==========================================
# Clave Interna para Pruebas de Carga
# ==========================================
INTERNAL_API_KEY="tu_clave_secreta_para_pruebas_y_servicios"

# ==========================================
# Proveedores de Inteligencia Artificial
# ==========================================
GEMINI_API_KEY="AQ.Ab8RN6IrCLVIkDq_..."
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-..."
GROQ_API_KEY="gsk_..."

# Servidor Local Mac Mini M4 vía Cloudflare Tunnel (Opcional)
LOCAL_MAC_BASE_URL="https://tu-tunel.cloudflare.com/v1"

# ==========================================
# Almacenamiento CDN (UploadThing)
# ==========================================
UPLOADTHING_TOKEN="tu_uploadthing_token"
```

### 4. Sincronizar y generar la base de datos
```bash
# Aplicar migraciones en desarrollo
npx prisma migrate dev

# Generar cliente de Prisma
npx prisma generate
```

### 5. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del Proyecto

```text
sipangpt/
├── .github/                            # Flujos de trabajo automatizados
│   └── workflows/
│       └── deploy.yml                  # Pipeline CI/CD para GHCR y despliegue en VPS
│
├── app/                                # Next.js 16 App Router
│   ├── (public)/                       # Vistas públicas institucionales
│   │   ├── terms/                      # Términos, condiciones y privacidad USS
│   │   ├── posts/                      # Novedades y publicaciones institucionales
│   │   ├── invitacion/                 # Aceptación de invitaciones administrativas
│   │   ├── unauthorized/               # Pantalla de acceso no autorizado
│   │   └── page.tsx                    # Landing Page institucional USS
│   ├── login/                          # Página de autenticación centralizada
│   │   ├── layout.tsx
│   │   └── page.tsx                    # Login con Google OAuth y credenciales
│   ├── (protected)/                    # Rutas protegidas por sesión y roles
│   │   ├── chat/                       # Interfaz conversacional principal
│   │   │   ├── page.tsx                # Chat nuevo con preguntas sugeridas
│   │   │   └── [id]/page.tsx           # Chat histórico y persistencia dinámica
│   │   ├── configuraciones/            # Preferencias de usuario, perfil y consumo
│   │   │   ├── consumo/                # Monitoreo de cuota diaria y tokens consumidos
│   │   │   ├── memorias/               # Gestión de recuerdos y hechos personalizados
│   │   │   ├── sesiones/               # Dispositivos y sesiones concurrentes
│   │   │   └── usuario/                # Datos personales y cambio de clave
│   │   └── admin/                      # Módulos del Panel de Administración
│   │       ├── administradores/        # Gestión de administradores e invitaciones
│   │       ├── categories/             # Taxonomía de temas académicos USS
│   │       ├── conversations/          # Inspector forense de chats, latencias y fuentes
│   │       ├── dashboard/              # Métricas, inferencias y gráficos de uso
│   │       ├── documents/              # Ingesta RAG, editor de Chunks y paginación
│   │       ├── models/                 # Monitor de modelos, salud y costos USD
│   │       ├── posts/                  # Gestión de comunicados institucionales
│   │       ├── questions/              # Preguntas sugeridas dinámicas
│   │       └── settings/               # Políticas de gobernanza, RAG, Web y Slider
│   ├── api/                            # API Routes & Webhooks
│   │   ├── admin/documents/
│   │   │   ├── export/route.ts         # Exportación de Snapshots RAG (.json.gz)
│   │   │   └── import/route.ts         # Importación por lotes de Snapshots RAG (3 fases)
│   │   ├── auth/                       # Endpoints de NextAuth.js
│   │   ├── chat/                       # Streaming SSE, RAG STAIR y clave interna
│   │   ├── feedback/                   # Calificaciones de respuestas (1-5 estrellas)
│   │   ├── sesiones/                   # Revocación de sesiones activas
│   │   └── uploadthing/                # Endpoint y callbacks de subida UploadThing
│   ├── fonts.ts                        # Configuración de tipografías locales (Exo 2, Fraunces)
│   ├── globals.css                     # Estilos globales y mapeo Tailwind CSS v4
│   └── layout.tsx                      # Layout raíz con proveedores de tema y sesión
│
├── components/                         # Componentes de React
│   ├── admin/                          # Componentes del módulo de administración
│   │   ├── confirm-alert-dialog.tsx    # Modal reutilizable de confirmación destructiva
│   │   ├── conversations-inspector.tsx # Inspector forense de mensajes, latencias y citas
│   │   ├── document-preview-sheet.tsx  # Sheet interactivo con visor ToC, chunks e iframe PDF
│   │   ├── document-upload-zone.tsx    # Ingesta dual: archivos locales y enlaces web
│   │   ├── documents-manager.tsx       # Gestor RAG, paginación, editor de chunks y estados
│   │   ├── models-manager.tsx          # Panel de estado, salud y tarifas de modelos
│   │   ├── rag-snapshot-dialog.tsx     # Modal Exportar / Importar Snapshots RAG (.json.gz)
│   │   └── settings-manager.tsx        # Panel de políticas de gobernanza y Slider RAG
│   ├── chat/                           # Componentes del módulo de chat
│   │   ├── chat-empty-state.tsx        # Bienvenida y tarjetas de preguntas sugeridas
│   │   ├── chat-header.tsx             # Cabecera con selector de modelo responsive
│   │   ├── chat-input.tsx              # Input de consulta con voz, adjuntos y atajos
│   │   ├── chat-interface.tsx          # Contenedor orquestador del chat y streaming
│   │   ├── chat-loading-item.tsx       # Placeholder animado de inferencia del asistente
│   │   ├── chat-message-item.tsx       # Mensajes con MarkdownRenderer y citas RAG
│   │   ├── chat-side-panel.tsx         # Panel lateral de comunicados USS y fuentes citadas
│   │   └── model-selector.tsx          # Selector de modelos (Drawer móvil / Popover desktop)
│   ├── configuraciones/                # Componentes del perfil de usuario
│   │   ├── memories-manager.tsx        # Gestor de memorias y hechos personalizados
│   │   └── user-profile-form.tsx       # Formulario de datos de usuario
│   ├── landing/                        # Componentes modulares de la landing page
│   │   ├── archetype-selector-section.tsx # Selector interactivo de arquetipos estudiantiles
│   │   ├── benchmark-evidence-section.tsx # Evidencia y métricas del Benchmark UNPRG
│   │   ├── final-cta-section.tsx       # Llamado a la acción final institucional
│   │   ├── footer.tsx                  # Pie de página con enlaces y animaciones
│   │   ├── header.tsx                  # Cabecera de la página de inicio
│   │   ├── hero-preview-chat.tsx       # Simulador interactivo del chat en el Hero
│   │   ├── indexed-documents-strip.tsx # Carrusel de los 13 reglamentos USS
│   │   ├── mobile-menu.tsx             # Menú de navegación responsive para móviles
│   │   └── stair-architecture-section.tsx # Visualizador de la arquitectura STAIR
│   ├── shared/                         # Componentes compartidos y navegación
│   │   ├── admin-sidebar.tsx           # Barra lateral del panel administrativo
│   │   ├── app-sidebar.tsx             # Barra lateral principal del chat y navegación
│   │   ├── navbar.tsx                  # Header principal institucional
│   │   ├── settings-sidebar.tsx        # Barra lateral de configuración de usuario
│   │   ├── theme-toggle.tsx            # Alternador de modo oscuro/claro
│   │   └── user-button.tsx             # Dropdown de perfil, sesión y tema
│   └── ui/                             # Catálogo Shadcn UI (Card, Slider, Dialog, Attachment, etc.)
│
├── constants/                          # Constantes institucionales centralizadas
│   ├── admin.ts                        # Correos de administradores iniciales
│   ├── cache.ts                        # Rutas para revalidación ISR / Server Actions
│   ├── chat.ts                         # Parámetros de caché RAM, Top-K (8), RRF y límites de chat
│   ├── internal-auth.ts                # Claves de cabecera y usuario de benchmark
│   ├── models.ts                       # Catálogo de modelos IA, OCR (gemini-4-hydrogen) y precios
│   ├── prompts.ts                      # Prompts de chat, transcripción OCR y anti-recitación
│   ├── questions.ts                    # Preguntas iniciales sugeridas
│   ├── rag-snapshot.ts                 # Formato, versión y tamaño de lote para Snapshots RAG
│   ├── routes.ts                       # Rutas canónicas públicas, protegidas y admin
│   ├── stopwords.ts                    # Lista de stop words en español para enrutamiento ToC
│   ├── topic-categories.ts             # Taxonomía temática universitaria
│   └── index.ts                        # Archivo barril de constantes
│
├── docs/                               # Documentación técnica adicional
│   └── PERFORMANCE_TESTING.md          # Guía completa de pruebas de carga, k6 y cURL
│
├── lib/                                # Lógica de negocio, base de datos y utilidades
│   ├── actions/                        # Server Actions de Next.js
│   │   ├── admin-conversations.ts      # Acciones del inspector de conversaciones
│   │   ├── admin-documents.ts          # Ingesta URL, chunks, metadatos y eliminación CDN
│   │   ├── admin-models.ts             # Acciones de monitoreo de modelos y precios
│   │   ├── admin-settings.ts           # Acciones de políticas de gobernanza
│   │   └── user-settings.ts            # Acciones de memorias, perfil y consumo
│   ├── ai/                             # Módulo de Inteligencia Artificial
│   │   ├── document-processor.ts       # Chunking STAIR, OCR gemini-4-hydrogen y cascada fallback
│   │   ├── embeddings.ts               # Embeddings vectoriales con cómputo de tokens seguro
│   │   ├── providers.ts                # Inicializador de proveedores Vercel AI SDK
│   │   ├── query-rewriter.ts           # Pre-RAG NLU, condensación multiturno y expansión
│   │   ├── rag-snapshot.ts             # Codec isomórfico Float32 Base64 y validación de snapshots
│   │   ├── rag.ts                      # Caché L2 en RAM, RRF híbrido, vecinos y ToC (top-8)
│   │   ├── resolution-detector.ts      # Detección analítica del estado de resolución
│   │   ├── toc-extractor.ts            # Extractor ToC Tree (reglamentos/manuales) y overlap
│   │   └── token-tracker.ts            # Auditoría y estimación de costos en USD
│   ├── auth/                           # Módulo de autenticación interna y sincronización
│   │   ├── internal-auth.ts            # Validación de API Key interna para pruebas de carga
│   │   └── multi-tab-sync.ts           # Sincronización de sesión entre pestañas
│   ├── prisma.ts                       # Singleton PrismaClient con Adapter PG y pool reutilizable
│   ├── session.ts                      # Validación de sesión/roles (`requireRole`, `getAdminApiAuth`)
│   ├── timeago.ts                      # Formateador de tiempo relativo en español
│   ├── uploadthing.ts                  # Clientes y handlers de UploadThing
│   └── utils.ts                        # Utilidades generales y función `cn`
│
├── prisma/                             # Esquema y migraciones de base de datos
│   ├── migrations/                     # Historial de migraciones SQL versionadas
│   └── schema.prisma                   # Esquema Prisma con modelos, enums e índices
│
├── public/                             # Recursos estáticos (avatares, fuentes, imágenes)
├── types/                              # Definiciones de tipos TypeScript
│   ├── admin.ts                        # Tipos de administración y documentos
│   ├── chat.ts                         # Tipos de mensajería, fuentes y streaming
│   ├── stair.ts                        # Tipos de la arquitectura Sipán-STAIR (ToC Tree)
│   └── index.ts                        # Exportaciones de tipos consolidadas
├── Dockerfile                          # Contenedor multi-etapa Node 22 Alpine para producción
├── next.config.ts                      # Configuración Next.js (output: standalone)
├── package.json                        # Dependencias y scripts del proyecto
└── tsconfig.json                       # Configuración de TypeScript
```

---

## 🧬 Ecosistema del Proyecto de Tesis: Pipeline de Datos, Fine-Tuning y Benchmark

**SipánGPT** no es únicamente una interfaz web conversacional; constituye el componente aplicativo central de una investigación y desarrollo de tesis para la **Universidad Nacional Pedro Ruiz Gallo (UNPRG)** aplicada a la **Universidad Señor de Sipán (USS)**. Para dotar al asistente de respuestas fiables, tanto a nivel de recuperación contextual (**RAG Sipán-STAIR**) como en la especialización de modelos mediante ajuste fino (*Fine-Tuning*), el proyecto se articula en un flujo integral respaldado por repositorios complementarios que abarcan desde la preparación de datos hasta la evaluación científica comparativa:

```mermaid
flowchart LR
    subgraph FASE1 ["📄 FASE 1: Ingesta & Transcripción"]
        A["13 Manuales y Reglamentos USS (PDF/.url)"] --> B["Pipeline Gemini OCR/Transcripción"]
        B --> C["Corpus Normalizado en Markdown (.md)"]
    end

    subgraph FASE2 ["🧪 FASE 2: Síntesis ShareGPT"]
        C --> D["267 Secciones Semánticas Atómicas"]
        D --> E["Fábrica de Datos Sintéticos (Gemini + Pydantic)"]
        E --> F["Dataset 400 Diálogos (ShareGPT / Unsloth)"]
    end

    subgraph FASE3 ["🚀 FASE 3 / APLICACIÓN: SipánGPT"]
        C -. Corpus Base .-> G["Motor RAG Sipán-STAIR (Neon PostgreSQL)"]
        F -. Fine-Tuning Gemma 4 .-> H["Modelos Locales & en la Nube"]
        G --> I["Plataforma Conversacional Web (Next.js 16)"]
        H --> I
    end

    subgraph EVAL ["📊 EVALUACIÓN: Benchmark Científico"]
        H -. Gemma-4 LoRA .-> J["Suite de Benchmark Comparativo"]
        G -. Sipán-STAIR .-> J
        J --> K["Evaluación de Tesis UNPRG (LLM-as-a-Judge)"]
    end
```

### 📦 Repositorios Complementarios del Proyecto

| Fase / Rol | Repositorio Oficial | Rol y Contribución al Proyecto | Tecnologías Clave |
| :--- | :--- | :--- | :--- |
| **Fase 1** | [**`codigo_para_generar_dataset_finetuning`**](https://github.com/jhangmez/codigo_para_generar_dataset_finetuning) | **Pipeline de Ingesta y Transcripción Técnica de Documentación USS:** Descarga automatizada condicional de 13 reglamentos y manuales institucionales vía `.url`, particionado PDF en memoria (`pypdf`) y transcripción estructurada a Markdown de alta fidelidad con **Google Gemini**, interpretando tablas analíticas y secuencias de interfaz gráfica. | Python 3.10+, `google-genai`, `pypdf`, `requests`, `pydantic` |
| **Fase 2** | [**`codigo_para_sintesis_dataset_sharegpt`**](https://github.com/jhangmez/codigo_para_sintesis_dataset_sharegpt) | **Fábrica de Datos Sintéticos ShareGPT para Fine-Tuning:** Generación determinista y controlada por cuotas de un dataset de **400 conversaciones balanceadas** (70% monoturno / 30% multiturno) con 3 arquetipos lingüísticos peruanos y formato dual nativo listo para entrenar modelos con **Unsloth** y **Gemma 4**. | Python 3.10+, Gemini Structured Outputs, Pydantic, Unsloth ShareGPT |
| **Evaluación & Benchmark** | [**`codigo_para_evaluar_sipangpt_benchmark`**](https://github.com/jhangmez/codigo_para_evaluar_sipangpt_benchmark) | **Suite de Evaluación Comparativa de Rigor Científico:** Suite automatizada y reproducible para el informe de tesis (UNPRG) que evalúa cuantitativa y cualitativamente a **Gemma-4 Fine-Tuned (LoRA)** vs. **Sipán-STAIR (RAG)** bajo la metodología *LLM-as-a-Judge* (NeurIPS 2023) sobre 50 casos del banco de pruebas oficial. | Python 3.11+, Pydantic v2, Strict Typing, Benchmark: NeurIPS 2023, Evaluator: Jev System One |

---

### 🔍 Detalle de los Módulos Complementarios

#### 1. 📄 [Fase 1: Pipeline de Ingesta y Transcripción Técnica de Documentación USS](https://github.com/jhangmez/codigo_para_generar_dataset_finetuning)
* **Propósito:** Transformar la documentación institucional dispersa en manuales PDF de gran volumen en un corpus técnico estructurado en Markdown de alta fidelidad, sirviendo como insumo base tanto para la base de conocimiento RAG como para la síntesis conversacional.
* **Aspectos Técnicos Destacados:**
  - **Catálogo de 13 Documentos Oficiales Mapeados:** Cobertura de las áreas de *Pagos y Cobranzas*, *Campus Virtual y Aprendizaje*, *Matrícula y Registros*, *Biblioteca Virtual* y *Normativa y Trámites*.
  - **Particionado en Memoria con `pypdf`:** División de documentos en lotes de páginas (6 páginas por bloque) sin escritura temporal en disco, optimizando I/O y uso de memoria.
  - **Transcripción Guiada por IA (`GeminiTranscriber`):** Empleo del SDK `google-genai` bajo un *System Prompt* estricto que preserva jerarquías de títulos (`##`, `###`), transcribe tablas acompañadas de bloques analíticos (`> **Interpretación de la tabla:**`) y detalla pantallas de sistemas (`> **Interpretación de la imagen/interfaz:**`).
  - **Resiliencia y Fallback:** Backoff exponencial ante saturación de cuota (`429`) y conmutación automática de respaldo a `gemini-3.5-flash-lite` ante errores temporales de servicio (`503`).

#### 2. 🧪 [Fase 2: Fábrica de Datos Sintéticos ShareGPT para Fine-Tuning USS](https://github.com/jhangmez/codigo_para_sintesis_dataset_sharegpt)
* **Propósito:** Sintetizar pares conversacionales realistas, pedagógicos y balanceados que emulan las consultas habituales de la comunidad universitaria, garantizando la identidad de **SipánGPT** y preparando los datos para el ajuste fino de modelos de lenguaje abiertos (como **Gemma 4**).
* **Aspectos Técnicos Destacados:**
  - **Segmentación Semántica Atómica:** Procesamiento de 267 secciones temáticas delimitadas (~500 a 1,500 palabras) a partir del Markdown de la Fase 1.
  - **Matriz de Cuotas Exacta (400 diálogos):**
    - *Campus Virtual y Aprendizaje:* **130** (91 monoturno / 39 multiturno)
    - *Matrícula y Registros:* **110** (77 monoturno / 33 multiturno)
    - *Pagos y Cobranzas:* **70** (49 monoturno / 21 multiturno)
    - *Normativa y Trámites:* **55** (39 monoturno / 16 multiturno)
    - *Biblioteca Virtual:* **35** (24 monoturno / 11 multiturno)
    - Proporción global: **70% Monoturno (280)** vs. **30% Multiturno (120)**.
  - **Diversidad Lingüística en 3 Arquetipos:**
    - `frustrado_informal`: Estudiantes que consultan con expresiones cotidianas y modismos peruanos (*"oe"*, *"pucha"*, *"se colgó el campus"*).
    - `formal_protocolar`: Redacción académica con cortesía institucional formal.
    - `docente`: Consultas especializadas sobre actas de notas, enlaces Zoom, sílabos y gestión docente en el campus.
  - **Garantía Estructural (Zero Parsing Errors):** Uso de **Structured Outputs de Gemini** y esquemas Pydantic para asegurar que cada diálogo cumpla con la especificación de ShareGPT sin fallas de sintaxis JSON.
  - **Compatibilidad Nativa con Unsloth & Gemma 4 (Fase 3):** Estructura dual (`conversations` y `messages`) que permite cargar directamente los archivos `.jsonl` en notebooks de Google Colab o Kaggle mediante Unsloth para fine-tuning sin scripts de transformación previa.

#### 3. 📊 [Evaluación & Benchmark: Suite de Evaluación Comparativa de Rigor Científico](https://github.com/jhangmez/codigo_para_evaluar_sipangpt_benchmark)

<p align="left">
  <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/python-3.11%2B-blue.svg" alt="Python 3.11+"></a>
  <a href="https://docs.pydantic.dev/"><img src="https://img.shields.io/badge/Pydantic-v2-green.svg" alt="Pydantic v2"></a>
  <a href="https://mypy.readthedocs.io/"><img src="https://img.shields.io/badge/Code%20Style-Strict%20Typing-brightgreen.svg" alt="Code Style: Strict Typing"></a>
  <a href="https://arxiv.org/abs/2306.05685"><img src="https://img.shields.io/badge/Benchmark-NeurIPS%202023-orange.svg" alt="Benchmark: NeurIPS 2023"></a>
  <a href="https://ai-gateway.vercel.sh"><img src="https://img.shields.io/badge/Evaluator-Jev%20System%20One-8A2BE2.svg" alt="Evaluator: Jev System One"></a>
</p>

* **Repositorio Oficial:** [**`codigo_para_evaluar_sipangpt_benchmark`**](https://github.com/jhangmez/codigo_para_evaluar_sipangpt_benchmark)
* **Título:** Suite de Evaluación Comparativa de Rigor Científico: Gemma-4 Fine-Tuned vs. Sipán-STAIR (RAG)
* **Descripción:**
  Este repositorio contiene la suite de evaluación automatizada, científica y reproducible desarrollada para el informe de tesis de la **Universidad Nacional Pedro Ruiz Gallo (UNPRG)**. El objetivo principal es evaluar cuantitativa y cualitativamente el desempeño de dos aproximaciones tecnológicas para asistentes virtuales académicos en la **Universidad Señor de Sipán (USS)**:
  - **Gemma-4 Fine-Tuned (LoRA):** Modelo de lenguaje adaptado localmente mediante cuantización GGUF Q4_K_M ejecutado en Apple Silicon.
  - **Sipán-STAIR (RAG Architecture):** Sistema de Generación Aumentada por Recuperación con citación contextual, reranking y verificación fáctica sobre Next.js y PostgreSQL.
* **Aspectos Técnicos Destacados:**
  - **Metodología Reference-Guided LLM-as-a-Judge (NeurIPS 2023):** Implementación del estándar riguroso de evaluación basado en Zheng et al. (UC Berkeley / LMSYS) con Gemini 3.5 Flash a temperatura 0.0 y contratos estrictos Pydantic v2 para clasificar respuestas en Correcta ($1.0\text{ pt}$), Parcial ($0.5\text{ pt}$) e Incorrecta / Alucinación ($0.0\text{ pt}$).
  - **Banco de Pruebas Oficial:** 50 casos de prueba balanceados (70% monoturno / 30% multiturno) extraídos de [ussipan/sipangpt-V2](https://huggingface.co/datasets/ussipan/sipangpt-V2) en Hugging Face, abarcando los 5 módulos temáticos de la USS.
  - **Resultados Cuantitativos (Cuarta Tanda Oficial):** La arquitectura **Sipán-STAIR (RAG)** alcanzó un **99.00% de exactitud global fáctica** (49 respuestas correctas y 1 parcial) frente al **5.00% de Gemma-4 Fine-Tuned (LoRA)** (+94.00%), logrando **cero alucinaciones fácticas (0.0% de error en RAG)** frente al 92.0% de alucinaciones del modelo puramente generativo sin recuperación.

---

## 📚 Referencias Académicas y Marco Teórico

La arquitectura de recuperación e indexación jerárquica de **SipánGPT** (**Sipán-STAIR**) se fundamenta teórica y metodológicamente en las investigaciones más recientes sobre recuperación consciente de la estructura documental para modelos de lenguaje (*Large Language Models*):

### Paper Base / Publicación Científica

> **STAIR (STructure Aware Information Retriever): A novel dataset and LLM based retriever for document structure augmentation**  
> *Vineet Kumar, Meghanadh Pulivarthi, Vishwajeet Kumar, Jaydeep Sen, Riyaz Ahmad Bhat, Sachindra Joshi*  
> **IBM Research** — arXiv:2609.03874v1 [cs.AI], Septiembre 2026.  
> 🔗 **Enlace Oficial:** [https://arxiv.org/html/2609.03874v1](https://arxiv.org/html/2609.03874v1) | [PDF en arXiv](https://arxiv.org/pdf/2609.03874v1)

---

### 🔬 Aportes del Paper Adaptados a SipánGPT

1. **Mitigación del efecto *"Lost in the Middle"***: Los recuperadores tradicionales dividen textos largos en fragmentos uniformes basados en cantidad arbitraria de caracteres o tokens, destruyendo la coherencia jerárquica (Título ➔ Capítulo ➔ Artículo). STAIR demuestra que utilizar la estructura del documento como unidad de indexación preserva el contexto semántico integral.
2. **Table of Contents (ToC) como Guía de Enrutamiento**: El paper introduce el uso del árbol de contenidos (*ToC Tree*) como índice semántico de primer nivel. En SipánGPT, esto se traduce en el algoritmo `routeQueryToToCBranches` que poda ramas irrelevantes y restringe la búsqueda exclusivamente a los capítulos y artículos pertinentes.
3. **Recuperación en Dos Etapas (*Two-Stage Retrieval*)**: En lugar de calcular distancias vectoriales sobre miles de fragmentos planos, se ejecuta una primera fase de enrutamiento estructural guiado por ToC, seguida de una búsqueda semántica de alta precisión en el espacio vectorial local, logrando una reducción drástica de falsos positivos y alucinaciones (< 0.05%).
4. **Respaldado para Tesis de Pregrado**: La adopción de este marco permite justificar formal y cuantitativamente la metodología del sistema ante comités evaluadores, citando un paper de **IBM Research** y contrastando empíricamente el RAG tradicional plano (*Baseline*) frente a RAG Jerárquico Guiado por Estructura (*Sipán-STAIR*).

---

### 📖 Formato de Citación Académica

#### Formato APA (7.ª Edición)
```text
Kumar, V., Pulivarthi, M., Kumar, V., Sen, J., Bhat, R. A., & Joshi, S. (2026). STAIR (STructure Aware Information Retriever): A novel dataset and LLM based retriever for document structure augmentation. arXiv preprint arXiv:2609.03874. https://doi.org/10.48550/arXiv.2609.03874
```

#### Formato IEEE
```text
V. Kumar, M. Pulivarthi, V. Kumar, J. Sen, R. A. Bhat, and S. Joshi, "STAIR (STructure Aware Information Retriever): A novel dataset and LLM based retriever for document structure augmentation," arXiv:2609.03874 [cs.AI], Sep. 2026. [Online]. Available: https://arxiv.org/abs/2609.03874
```

#### Formato BibTeX (para LaTeX / Overleaf / Tesis)
```bibtex
@misc{kumar2026stair,
  title         = {STAIR (STructure Aware Information Retriever): A novel dataset and LLM based retriever for document structure augmentation}, 
  author        = {Vineet Kumar and Meghanadh Pulivarthi and Vishwajeet Kumar and Jaydeep Sen and Riyaz Ahmad Bhat and Sachindra Joshi},
  year          = {2026},
  eprint        = {2609.03874},
  archivePrefix = {arXiv},
  primaryClass  = {cs.AI},
  url           = {https://arxiv.org/abs/2609.03874},
  institution   = {IBM Research}
}
```

---

## 👨‍💻 Autor y Créditos

<div style="display: flex; align-items: center; gap: 12px; height: fit-content; margin-top: 10px;">
  <img src="https://avatars.githubusercontent.com/u/60937214?v=4" width="46" style="border-radius: 50%;"/>
  <span><strong>Desarrollado con ❤️ y rigor científico por Jhan Gómez Padilla</strong><br/>Proyecto de Tesis de Ingeniería de Sistemas — Universidad Nacional Pedro Ruiz Gallo (UNPRG) & Universidad Señor de Sipán (USS)</span>
</div>

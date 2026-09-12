# SipánGPT • Asistente Virtual Universitario con IA & RAG Institucional

<div align="center">

![SipánGPT Portada y Chat Interface](./public/imagenes/IMAGEN_SIPANGPT_CHAT_25082026.png)

[![Next.js](https://img.shields.io/badge/Next.js_16_(Turbopack)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK_7.x-000000?style=for-the-badge&logo=vercel)](https://ai-sdk.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_3.1-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Neon Database](https://img.shields.io/badge/Neon_PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 🌟 Descripción General

**SipánGPT** es una plataforma integral de asistencia conversacional con Inteligencia Artificial Generativa diseñada a la medida para la **Universidad Señor de Sipán (USS)**. Permite a estudiantes, docentes y postulantes resolver consultas sobre procesos de matrícula, trámites de grados y títulos, directivas académicas, mallas curriculares y servicios institucionales con respuestas oficiales, citadas y sustentadas en la normativa universitaria.

La plataforma incorpora una arquitectura **RAG (Retrieval-Augmented Generation) de Alta Fidelidad** conectada a una base vectorial en PostgreSQL (Neon), renderizado matemático y de diagramas, soporte para modelos en la nube y locales (Mac Mini M4 vía Cloudflare Tunnel), personalización mediante **Memorias de Usuario**, gobernanza activa de políticas administrativas en el chat y auditoría de costos en tiempo real.

---

## 🚀 Características Principales

### 1. 💬 Experiencia de Chat Conversacional Avanzada
- **Streaming de Texto en Tiempo Real:** Implementado con **Vercel AI SDK 7.x** (`streamText`, `toUIMessageStream`) y decodificación reactiva de paquetes SSE (`text-delta`, `reasoning-delta`).
- **Persistencia y Continuidad de Conversaciones:** Creación de conversaciones por adelantado, sincronización dinámica de URLs (`/chat/[id]`), regeneración y branching de respuestas alternativas.
- **Renderizador Markdown Shadcn de Alta Precisión (`shadcn-markdown`):**
  - 📐 **Fórmulas Matemáticas:** Renderizado LaTeX inline (`$E=mc^2$`) y en bloque con KaTeX.
  - 💻 **Bloques de Código:** Resaltador de sintaxis Prism (`vscDarkPlus`), formateo JSON automático y botón interactivo para **Copiar Código**.
  - 📊 **Diagramas de Flujo Mermaid:** Renderizador SVG de diagramas de flujo (`graph TD`) integrado.
  - 📑 **Tablas GFM Responsivas:** Formateo automático de tablas con scroll horizontal adaptativo.
- **Sistema de Feedback y Calificación:** Puntuación de mensajes (1 a 5 estrellas) con modales de cuestionario para auditoría de calidad.
- **Entrada de Voz y Adjuntos Multimodales:** Grabación y transcripción de notas de voz, y análisis visual de capturas y documentos PDF.
- **Transparencia en la Interfaz de Usuario:** Notificaciones y alertas contextuales directas del servidor (modo mantenimiento, límite de caracteres o cuota de tokens alcanzada).

---

### 2. 🏛️ Arquitectura "Sipán-STAIR" (Structure-Aware Indexing and Retrieval) & Pipeline RAG
Para la recuperación de normativas universitarias y reglamentos oficiales de la USS, SipánGPT implementa la metodología de **STAIR** (*Structure-Aware Indexing and Retrieval*), adaptada para superar las limitaciones de los sistemas RAG convencionales basados en ventanas ciegas de texto:

```mermaid
graph TD
    subgraph INGESTA_DUAL ["📥 1. Ingesta Dual de Documentos"]
        A1["📂 Archivo Local (Drag & Drop / Explorar)"] --> P["⚡ Pre-procesamiento de Archivo"]
        A2["🔗 Enlace Web / URL (Portal USS / SUNEDU)"] --> P
    end

    P --> B["🤖 2. OCR Multimodal Gemini (65k Tokens + Continuación Multi-Pass)"]
    B --> C["🌳 3. Extractor de Árbol ToC Canónico (Títulos > Capítulos > Artículos)"]
    C --> D["✂️ 4. Chunking Estructural por Artículos Completos (sin cortes arbitrarios)"]
    D --> E["📐 5. Generación de Embeddings Vectoriales (gemini-embedding-2)"]
    E --> F["🗄️ 6. Indexación en Neon PostgreSQL (Document.tocTree + DocumentChunk)"]

    subgraph CONSULTA ["🧑‍🎓 7. Recuperación en Dos Etapas (Two-Stage ToC Retrieval)"]
        Q["❓ Consulta del Estudiante"] --> R1["🌳 Etapa 1: Poda de Árbol ToC en Memoria (routeQueryToToCBranches)"]
        R1 --> R2["🎯 Etapa 2: Búsqueda Vectorial Semántica en Hojas (Leaf Retrieval)"]
        R2 --> CIT["📌 8. Generación con Cita Jerárquica y Enlace Oficial (publicUrl)"]
    end
```

#### Pilares Metodológicos de Sipán-STAIR:
1. **🌳 Extracción y Persistencia del Árbol ToC (`Document.tocTree`):**
   - Construye una representación jerárquica canónica de la norma (`Secciones > Capítulos > Artículos`).
   - Almacenado como estructura `JSONB` en PostgreSQL para permitir podas de árbol en memoria ultrarrápidas (< 5ms).
2. **✂️ Chunking Estructural por Artículos Completos (`splitTextIntoStructuralChunks`):**
   - En lugar de cortar el texto arbitrariamente cada 650 caracteres a mitad de una frase o artículo, delimita el fragmento respetando las fronteras normativas del reglamento.
   - Si un artículo es muy extenso (> 3,000 caracteres), se segmenta internamente preservando el contexto padre.
   - **Inyección de Breadcrumbs Contextuales:** Cada fragmento incluye en su cabecera y metadatos la ruta jerárquica completa (ej: `[Reglamento General de Matrícula USS > Capítulo II > Artículo 17: Matrícula Extemporánea]`).
3. **🎯 Recuperación en Dos Etapas (*Two-Stage ToC Retrieval*):**
   - **Etapa 1 (Poda de Árbol / ToC Routing):** Evalúa la consulta del estudiante contra los títulos de capítulos y artículos del índice ToC en memoria.
     - **Detección Flexible de Artículos:** Expresión regular con límite de palabra insensible a puntos (`/\b(?:art[íi]culo|art\.?)\s*([0-9]+)/i`) para interpretar tanto `"art 15"` como `"art. 15"` o `"artículo 15"`.
     - **Filtro de Stop Words en Español:** Excluye preposiciones y artículos comunes (`del`, `los`, `con`, `para`) para evitar sesgos de puntuación.
   - **Etapa 2 (Leaf Retrieval):** Búsqueda semántica con similitud de coseno (`gemini-embedding-2`) dirigida hacia las ramas podadas, combinada con red de seguridad (*safety net*) de fragmentos recientes.
4. **📌 Citas Oficiales con Enlace Institucional:**
   - La IA fundamenta cada respuesta citando expresamente la norma, capítulo y artículo correspondiente, acompañándolo con la insignia de ruta y el enlace directo (`publicUrl`) para abrir el reglamento oficial original.

---

### 3. 🧠 Personalización Contextual con Memorias de Usuario (`UserMemory`)
- Los estudiantes pueden gestionar en `/configuraciones/memorias` hechos y preferencias sobre su trayectoria académica (ej. *"Estudio Ingeniería de Sistemas en Sede Chiclayo"*, *"Curso el 6to ciclo"*).
- **Inyección Automática en el Chat:** En cada consulta, el sistema recupera las memorias activas del usuario (`isActive: true`) y las inyecta en el prompt del sistema (`[MEMORIA DEL ESTUDIANTE]`), adaptando respuestas y normativas al contexto del alumno sin necesidad de que deba reiterarlo en cada mensaje.

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

### 5. 📑 Ingesta Dual, Visualización y Edición de Documentos (`/admin/documents`)
- **Ingesta Dual de Documentos (Archivos Locales & Enlaces Web Oficiales):**
  - **📂 Modo Archivos Locales:** Carga rápida multiarchivo mediante UploadThing y componentes `Attachment` de Shadcn UI (PDF, TXT y Markdown hasta 16 MB).
  - **🔗 Modo Importar desde Enlace / URL:** Ingesta directa ingresando la URL pública de un reglamento institucional (ej. portal de transparencia de la USS, repositorio institucional o directivas SUNEDU).
  - **Preservación de `publicUrl`:** El enlace proporcionado se guarda permanentemente como la URL pública oficial institucional del documento y se utiliza en las citas del chat para que los estudiantes contrasten la fuente original con un solo clic.
  - **Copia de Respaldo Persistente:** Almacenamiento seguro del binario en la CDN vía `UTApi`.
- **Motor OCR de Alta Capacidad para Documentos Extensos:**
  - **65,536 Tokens de Salida:** Capacidad ampliada en 8x para transcribir íntegramente compendios densos de 80 a 120 páginas en una sola pasada.
  - **Bucle de Continuación Multi-Turno Automática:** Ante compendios masivos (> 150 páginas), si la API reporta `finishReason: MAX_TOKENS`, el sistema envía solicitudes consecutivas de continuación hasta alcanzar `finishReason: STOP`, garantizando **0% de pérdida de artículos, tablas o caracteres**.
- **Visualizador Avanzado con Pestaña de Índice ToC (STAIR):**
  - Vista previa en modal y Sheet lateral interactivo (`DocumentPreviewSheet`).
  - Pestaña **"Índice ToC (STAIR)"** que permite navegar el árbol jerárquico de Capítulos y Artículos y saltar directamente al fragmento semántico correspondiente en la pestaña de Chunks.
- **Editor de Chunks RAG con Preservación de Metadatos:**
  - Buscador textual interno dentro de los fragmentos del documento.
  - Edición en línea de texto y metadatos jerárquicos preservando datos contextuales previos (`prevMeta`).
  - Creación manual de nuevos fragmentos heredando categoría y año de vigencia.
  - Contador de citas realizadas por la IA por cada fragmento.
- **Control de Estados RAG:** Alternar entre estados `INDEXED` (Activo para consultas) y `DEINDEXED` (Pausado temporalmente).
- **Modales de Alerta Reutilizables (`AlertDialog`):** Confirmaciones de seguridad para eliminar documentos, fragmentos o desindexar.

---

### 6. 🤖 Auditoría de Tokens, Costos y Monitor de Modelos (`/admin/models`)
- **Modelos en la Nube y Locales:** Gemini 3.1 Flash-Lite, Gemini 3.6 Flash, Gemini 3.5 Flash, Gemini 2.5 Pro, GPT-4o Mini, GPT-4o, Claude 3.5 Sonnet, Groq Llama 3.3 y Mac Mini M4 local vía Cloudflare Tunnel.
- **🪙 Auditoría Completa de Consumo por Concepto (`TokenUsageLog`):**
  - `CHAT_COMPLETION`: Respuestas conversacionales del asistente.
  - `DOCUMENT_OCR_TRANSCRIPTION`: Transcripción multimodal de PDFs a Markdown.
  - `RAG_EMBEDDING`: Generación de vectores de consulta e ingesta documental masiva (`generateEmbeddingWithUsage`).
  - `QUERY_ANALYSIS`: Normalización de intenciones del estudiante con Gemini Flash Lite.
- **Resiliencia Numérica y Relacional en Base de Datos:**
  - Sanitización estricta contra valores `NaN` o indefinidos en conteos de tokens y cálculo de costos en USD.
  - Inserciones relacionales seguras en Prisma Client 7 compatibles con conexiones opcionales de usuario y conversación.
- **Tarifas y Precios Referenciales (USD / 1M Tokens):** Configuración de precios por millón de tokens de entrada (Prompt) y salida (Completion) para estimación de costos en tiempo real.
- **Métricas y Vistas Acumuladas:** Contador de inferencias (`totalInferences`), tokens totales consumidos y costo estimado acumulado por cada modelo (`AIModelConfig`).
- **Monitor de Salud en Tiempo Real:** Estados `ONLINE`, `DEGRADED`, `OFFLINE` y `DISABLED`.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Framework Fullstack** | [Next.js 16 (App Router, Turbopack, Server Actions, RSC)](https://nextjs.org/) |
| **Lenguaje** | [TypeScript 5.x](https://www.typescriptlang.org/) |
| **Diseño y Estilos** | [Tailwind CSS v4](https://tailwindcss.com/), Base UI, [Shadcn UI](https://ui.shadcn.com/) |
| **Tipografías** | **Exo 2** (`--font-exo`) y **Fraunces** (`--font-frances`) locales variables |
| **Motor de IA** | [Vercel AI SDK 7.x](https://ai-sdk.dev/), [Google Generative AI](https://ai.google.dev/) |
| **Base de Datos & ORM** | [Neon Serverless PostgreSQL](https://neon.tech/), [Prisma ORM 7](https://www.prisma.io/) (`@prisma/adapter-pg`) |
| **Almacenamiento de Archivos** | [UploadThing](https://uploadthing.com/) |
| **Autenticación** | NextAuth.js (Google OAuth, credenciales y control de roles) |
| **Renderizado Markdown** | `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `react-syntax-highlighter`, KaTeX |
| **Iconografía y Notificaciones**| [Lucide Icons](https://lucide.dev/), [Sonner Toast](https://sonner.emilkowal.ski/) |

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
Crea un archivo `.env` en la raíz del proyecto tomando como base los siguientes valores:

```env
# Conexión a Base de Datos (Neon PostgreSQL)
DATABASE_URL="postgresql://usuario:password@ep-soft-unit.aws.neon.tech/neondb?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu_nextauth_secret_seguro"

# Proveedores de IA
GEMINI_API_KEY="AQ.Ab8RN6IrCLVIkDq_..."
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-..."
GROQ_API_KEY="gsk_..."

# Mac Mini M4 Local vía Cloudflare Tunnel (Opcional)
LOCAL_MAC_BASE_URL="https://tu-tunel.cloudflare.com/v1"

# UploadThing Storage
UPLOADTHING_TOKEN="tu_uploadthing_token"
```

### 4. Sincronizar y generar la base de datos
```bash
npx prisma migrate dev
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
├── app/                                # Next.js 16 App Router
│   ├── (auth)/                         # Rutas de autenticación (login, registro)
│   ├── (protected)/                    # Rutas protegidas por sesión y roles
│   │   ├── admin/                      # Módulos del Panel de Administración
│   │   │   ├── administradores/        # Gestión de administradores e invitaciones
│   │   │   ├── categories/             # Gestión de categorías temáticas
│   │   │   ├── dashboard/              # Métricas, inferencias y gráficos
│   │   │   ├── documents/              # Ingesta RAG, editor de Chunks y visualizador
│   │   │   ├── models/                 # Monitor de modelos y configuración
│   │   │   ├── posts/                  # Novedades y publicaciones institucionales USS
│   │   │   ├── questions/              # Preguntas sugeridas dinámicas
│   │   │   └── settings/               # Políticas de búsqueda, RAG, Web, Maps y Slider
│   │   ├── configuraciones/            # Preferencias de usuario, perfil y consumo
│   │   │   ├── consumo/                # Monitoreo de cuota diaria y tokens de usuario
│   │   │   ├── memorias/               # Gestión de recuerdos y hechos personalizados
│   │   │   ├── sesiones/               # Dispositivos y sesiones activas concurrentes
│   │   │   └── usuario/                # Datos personales y cambio de contraseña
│   │   ├── chat/                       # Interfaz conversacional principal
│   │   │   ├── page.tsx                # Chat nuevo con preguntas sugeridas
│   │   │   └── [id]/page.tsx           # Chat histórico y persistencia de conversación
│   ├── api/                            # API Routes & Webhooks
│   │   ├── auth/                       # Endpoints de NextAuth
│   │   ├── chat/                       # Route handler de streaming SSE y RAG (AI SDK 7.x)
│   │   ├── feedback/                   # Calificaciones de respuestas
│   │   ├── sesiones/                   # Revocación de sesiones
│   │   └── uploadthing/                # Endpoint de subida de archivos
│   ├── fonts.ts                        # Configuración de tipografías locales (Exo 2, Fraunces)
│   ├── globals.css                     # Estilos globales y mapeo Tailwind CSS v4
│   └── layout.tsx                      # Layout raíz con proveedores de tema y sesión
│
├── components/                         # Componentes de React
│   ├── admin/                          # Componentes del módulo de administración
│   │   ├── confirm-alert-dialog.tsx    # Modal reutilizable de confirmación destructiva
│   │   ├── document-preview-sheet.tsx  # Sheet interactivo con visor de árbol ToC (STAIR) y chunks
│   │   ├── document-upload-zone.tsx    # Ingesta dual: archivos locales y enlaces web oficiales
│   │   ├── documents-manager.tsx       # Gestor RAG, editor de Chunks y visualizador PDF
│   │   ├── models-manager.tsx          # Panel de estado y parámetros de modelos
│   │   └── settings-manager.tsx        # Panel de políticas de grounding y Slider RAG
│   ├── chat/                           # Componentes del módulo de chat
│   │   ├── chat-empty-state.tsx        # Bienvenida y tarjetas de preguntas sugeridas
│   │   ├── chat-header.tsx             # Cabecera con selector de modelo responsive
│   │   ├── chat-input.tsx              # Input de consulta con voz, adjuntos y atajos
│   │   ├── chat-interface.tsx          # Contenedor orquestador del chat y streaming
│   │   ├── chat-loading-item.tsx       # Placeholder animado de generación del asistente
│   │   ├── chat-message-item.tsx       # Mensajes con MarkdownRenderer y citas RAG
│   │   ├── chat-side-panel.tsx         # Panel lateral de comunicados USS y fuentes citadas
│   │   └── model-selector.tsx          # Selector de modelos con soporte móvil (Drawer/Modal)
│   ├── configuraciones/                # Componentes del perfil de usuario
│   │   ├── memories-manager.tsx        # Gestor de memorias y preferencias personales
│   │   └── user-profile-form.tsx       # Formulario de datos de usuario
│   ├── shared/                         # Componentes compartidos y sidebars
│   └── ui/                             # Componentes base Shadcn UI (Slider, Dialog, Attachment, etc.)
│
├── constants/                          # Constantes y textos institucionales centralizados
│   ├── admin.ts                        # Correos de administradores iniciales
│   ├── models.ts                       # Catálogo de modelos de IA, embeddings y proveedores
│   ├── prompts.ts                      # Prompts del sistema SipánGPT e inyectores RAG
│   ├── questions.ts                    # Preguntas iniciales sugeridas
│   ├── routes.ts                       # Rutas canónicas públicas, protegidas y admin
│   └── index.ts                        # Archivo barril de constantes
│
├── lib/                                # Lógica de negocio y utilidades
│   ├── actions/                        # Server Actions de Next.js
│   │   ├── admin-documents.ts          # Ingesta URL, chunks, metadatos y reindexación
│   │   ├── admin-models.ts             # Acciones de monitoreo de modelos
│   │   ├── admin-settings.ts           # Acciones de políticas de búsqueda e IA
│   │   └── user-settings.ts            # Acciones de memorias, perfil y consumo
│   ├── ai/                             # Módulo de Inteligencia Artificial
│   │   ├── document-processor.ts       # Chunking STAIR, OCR multimodal 65k tokens y continuación
│   │   ├── embeddings.ts               # Embeddings vectoriales con cómputo de tokens seguro
│   │   ├── providers.ts                # Inicializador de proveedores AI SDK
│   │   ├── query-rewriter.ts           # Pre-RAG NLU, expansión y detección de intenciones
│   │   ├── rag.ts                      # Two-Stage ToC Retrieval y búsqueda híbrida resiliente
│   │   ├── resolution-detector.ts      # Detección analítica del estado de resolución
│   │   ├── toc-extractor.ts            # Extracción canónica de ToC Tree y segmentación por artículos
│   │   └── token-tracker.ts            # Auditoría y estimación de costos en USD
│   ├── prisma.ts                       # Instancia singleton de PrismaClient con Adapter PG
│   ├── session.ts                      # Validación de sesión y roles (`requireRole`)
│   ├── timeago.ts                      # Formateador de tiempo relativo en español
│   ├── uploadthing.ts                  # Clientes y handlers de UploadThing
│   └── utils.ts                        # Utilidades generales y función `cn`
│
├── prisma/                             # Esquema y migraciones de base de datos
│   ├── migrations/                     # Historial de migraciones SQL versionadas
│   └── schema.prisma                   # Esquema Prisma con modelos y enums
│
├── public/                             # Recursos estáticos (avatares, fuentes, imágenes)
├── types/                              # Definiciones de tipos TypeScript
│   ├── admin.ts                        # Tipos de administración y documentos
│   ├── chat.ts                         # Tipos de mensajería y fuentes
│   ├── stair.ts                        # Tipos de la arquitectura Sipán-STAIR (ToC Tree)
│   └── index.ts                        # Exportaciones consolidadas
├── AGENTS.md                           # Protocolos de arquitectura, base de datos y UI
├── package.json                        # Dependencias y scripts del proyecto
└── tsconfig.json                       # Configuración de TypeScript
```

---

## SipánGPT

<div style="display: flex; align-items: center; height: fit-content;">
  <img src="https://avatars.githubusercontent.com/u/60937214?v=4" width="40" style="margin-right: 10px;"/>
  <span>Hecho con ❤️ por Jhan Gómez P.</span>
</div>

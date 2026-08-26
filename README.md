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

La plataforma incorpora una arquitectura **RAG (Retrieval-Augmented Generation)** de alta precisión conectada a una base vectorial en PostgreSQL (Neon), renderizado matemático y de diagramas, soporte para modelos en la nube y locales (Mac Mini M4 vía Cloudflare Tunnel), y un panel administrativo completo para la gobernanza de políticas de IA.

---

## 🚀 Características Principales

### 1. 💬 Experiencia de Chat Conversacional Avanzada
- **Streaming de Texto en Tiempo Real:** Implementado con **Vercel AI SDK 7.x** (`streamText`, `toUIMessageStream`) y decodificación reactiva de paquetes SSE (`text-delta`).
- **Persistencia y Continuidad de Conversaciones:** Creación de conversaciones por adelantado, sincronización dinámica de URLs (`/chat/[id]`) y carga de historial íntegro.
- **Renderizador Markdown Shadcn de Alta Precisión (`shadcn-markdown`):**
  - 📐 **Fórmulas Matemáticas:** Renderizado LaTeX inline (`$E=mc^2$`) y en bloque con KaTeX.
  - 💻 **Bloques de Código:** Resaltador de sintaxis Prism (`vscDarkPlus`), formateo JSON automático y botón interactivo para **Copiar Código**.
  - 📊 **Diagramas de Flujo Mermaid:** Renderizador SVG de diagramas de flujo (`graph TD`) integrado.
  - 📑 **Tablas GFM Responsivas:** Formateo automático de tablas con scroll horizontal adaptativo.
- **Sistema de Feedback y Calificación:** Puntuación de mensajes (1 a 5 estrellas) con modales de cuestionario para auditoría de calidad.
- **Entrada de Voz y Adjuntos Multimodales:** Grabación y transcripción de notas de voz, y análisis visual de capturas y documentos PDF.

---

### 2. 🧠 Motor RAG & Base de Conocimiento Institucional
- **Embeddings Vectoriales:** Generación de representaciones semánticas con `gemini-embedding-2` / `text-embedding-004`.
- **Cálculo de Similitud Coseno:** Ranking semántico en tiempo real para recuperar los fragmentos normativos más relevantes.
- **Citación y Trazabilidad:** Cada respuesta fundamentada muestra las fuentes oficiales utilizadas con número de página, fragmento extraído y enlace directo al PDF original.
- **Panel Lateral de Novedades y Fuentes:** Panel colapsable que alterna dinámicamente entre comunicados institucionales USS y las fuentes citadas del mensaje seleccionado.

---

### 3. 🛡️ Gobernanza y Políticas de Grounding para el Administrador (`/admin/settings`)
El administrador dispone de un panel visual exclusivo para regular las capacidades de búsqueda de los modelos:
- 📚 **Búsqueda Vectorial RAG (Documentos USS):** Activación/desactivación del motor RAG institucional.
- 🌐 **Búsqueda Web en Tiempo Real (Google Search Grounding):** Permite o bloquea el acceso a internet para evitar contaminación externa.
- 🗺️ **Geolocalización y Mapas (Google Maps Grounding):** Control de resolución de rutas y ubicaciones físicas del campus USS.
- 🖼️ **Visión Multimodal:** Control de análisis de imágenes y archivos adjuntos.
- 🎯 **Umbral Mínimo de Similitud Coseno:** Control interactivo mediante el componente oficial **`Slider` de Shadcn UI** (20% a 85%) para descartar fragmentos con baja correlación y erradicar alucinaciones.

---

### 4. 📑 Ingesta, Visualización y Edición de Documentos (`/admin/documents`)
- **Carga de Archivos Oficiales:** Integración con UploadThing para subir reglamentos en PDF y TXT.
- **Visualizador Integrado de Documentos:** Modal para previsualizar el PDF oficial o texto completo directamente dentro de la plataforma sin salir de ella.
- **Editor de Enlaces Públicos y Metadatos:** Permite modificar el título, categoría y URL pública del PDF institucional.
- **Explorador y Editor de Chunks RAG:**
  - Buscador textual interno dentro de los fragmentos del documento.
  - Editor en línea de texto y número de página con guardado instantáneo.
  - Incorporación manual de nuevos fragmentos normativos.
  - Contador de citas realizadas por la IA por cada fragmento.
- **Control de Estados RAG:** Alternar entre estados `INDEXED` (Activo para consultas) y `DEINDEXED` (Pausado temporalmente).
- **Modales de Alerta Reutilizables (`AlertDialog`):** Confirmaciones de seguridad para eliminar documentos, fragmentos o desindexar.

---

### 5. 🤖 Catálogo Multimodelo y Ruteo Inteligente (`/admin/models`)
- **Google Gemini:** `gemini-3.1-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-flash-thinking`.
- **OpenAI:** `gpt-4o`, `gpt-4o-mini`, `o3-mini`.
- **Anthropic:** `claude-3-5-sonnet-latest`.
- **Groq:** `llama-3.3-70b-versatile`.
- **Inferencia Local:** Conexión con Mac Mini M4 mediante Cloudflare Tunnel para modelos como `DeepSeek R1` y `Llama 3.3`.
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
│   │   ├── chat/                       # Interfaz conversacional principal
│   │   │   ├── page.tsx                # Chat nuevo con preguntas sugeridas
│   │   │   └── [id]/page.tsx           # Chat histórico y persistencia de conversación
│   ├── api/                            # API Routes & Webhooks
│   │   ├── auth/                       # Endpoints de NextAuth
│   │   ├── chat/                       # Route handler de streaming SSE y RAG (AI SDK 7.x)
│   │   └── uploadthing/                # Endpoint de subida de archivos
│   ├── fonts.ts                        # Configuración de tipografías locales (Exo 2, Fraunces)
│   ├── globals.css                     # Estilos globales y mapeo Tailwind CSS v4
│   └── layout.tsx                      # Layout raíz con proveedores de tema y sesión
│
├── components/                         # Componentes de React
│   ├── admin/                          # Componentes del módulo de administración
│   │   ├── confirm-alert-dialog.tsx    # Modal reutilizable de confirmación destructiva
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
│   ├── shared/                         # Componentes compartidos y sidebars
│   ├── ui/                             # Componentes base Shadcn UI
│   │   ├── accordion.tsx               # Acordeón colapsable
│   │   ├── alert-dialog.tsx            # Modales de alerta de confirmación
│   │   ├── attachment.tsx              # Previsualizador de archivos adjuntos
│   │   ├── avatar.tsx                  # Avatares de usuario y asistente
│   │   ├── badge.tsx                   # Insignias de estado y roles
│   │   ├── bubble.tsx                  # Burbujas de chat conversacionales
│   │   ├── button.tsx                  # Botones de acción
│   │   ├── collapsible.tsx             # Contenedores colapsables
│   │   ├── dialog.tsx                  # Ventanas modales
│   │   ├── drawer.tsx                  # Paneles deslizables móviles
│   │   ├── dropdown-menu.tsx           # Menús desplegables
│   │   ├── empty.tsx                   # Estados vacíos compuestos
│   │   ├── markdown.tsx                # Renderizador Markdown (KaTeX, Mermaid, Prism)
│   │   ├── native-select.tsx           # Select nativo accesible con chevron
│   │   ├── select.tsx                  # Select flotante avanzado
│   │   ├── sidebar.tsx                 # Sidebar colapsable oficial
│   │   ├── slider.tsx                  # Control deslizante para umbral RAG
│   │   ├── switch.tsx                  # Toggles accesibles
│   │   └── toast.tsx                   # Sistema de notificaciones toast
│
├── constants/                          # Constantes y textos institucionales centralizados
│   ├── admin.ts                        # Correos de administradores iniciales
│   ├── models.ts                       # Catálogo de modelos de IA y proveedores
│   ├── prompts.ts                      # Prompts del sistema SipánGPT e inyectores RAG
│   ├── questions.ts                    # Preguntas iniciales sugeridas
│   ├── routes.ts                       # Rutas canónicas públicas, protegidas y admin
│   └── index.ts                        # Archivo barril de constantes
│
├── lib/                                # Lógica de negocio y utilidades
│   ├── actions/                        # Server Actions de Next.js
│   │   ├── admin-documents.ts          # Acciones de documentos, chunks y desindexación
│   │   ├── admin-models.ts             # Acciones de monitoreo de modelos
│   │   └── admin-settings.ts           # Acciones de políticas de búsqueda e IA
│   ├── ai/                             # Módulo de Inteligencia Artificial
│   │   ├── document-processor.ts       # Chunking semántico de reglamentos
│   │   ├── embeddings.ts               # Generador de embeddings con Gemini y similitud
│   │   ├── providers.ts                # Inicializador de proveedores AI SDK
│   │   └── rag.ts                      # Búsqueda semántica RAG y filtrado por umbral
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
├── public/                             # Recursos estáticos
│   ├── avatars/                        # Avatares predeterminados
│   ├── fonts/                          # Fuentes locales Exo 2 y Fraunces
│   ├── imagenes/                       # Capturas y carátula del proyecto
│   └── uss_logo.webp                   # Logo institucional de la USS
│
├── types/                              # Definiciones de tipos TypeScript
│   ├── chat.ts                         # Tipos de mensajes, fuentes y streaming
│   └── index.ts                        # Tipos de modelos, documentos y categorías
│
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

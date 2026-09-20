# 🚀 Guía de Pruebas Externas y Performance para SipánGPT Chat API

Esta guía detalla cómo cualquier sistema externo, script automatizado (k6, Artillery, Locust, Python, Node.js) o herramienta de prueba (Postman, cURL) puede conectarse y ejecutar pruebas de carga o rendimiento contra el endpoint `/api/chat` de SipánGPT de forma segura y sin depender de cookies de sesión OAuth interactivas.

---

## 🔐 1. Autenticación Segura (API Key Interna)

Para evitar la dependencia de inicio de sesión manual con Google OAuth y no saturar la tabla de sesiones de la base de datos, el backend admite autenticación mediante una **Pre-Shared API Key**.

### Cabeceras HTTP soportadas (utilizar una de las dos):
```http
x-api-key: <CLAVE_SECRETA>
```
o
```http
Authorization: Bearer <CLAVE_SECRETA>
```

### Configuración de la clave:
* **Producción / Staging:** Definir en el archivo `.env` o `.env.local`:
  ```env
  INTERNAL_API_KEY=tu_clave_secreta_super_segura_aqui
  ```
  *(También se admite `PERF_TEST_API_KEY` o `SIPANGPT_API_KEY`)*.
* **Desarrollo Local:** Si no se define ninguna variable en `.env`, el servidor en modo desarrollo (`NODE_ENV !== 'production'`) acepta por defecto la clave:
  ```
  sipangpt-local-perf-key
  ```
* **Usuario asignado:** La petición se asocia automáticamente a un usuario de benchmark del sistema (`benchmark-agent@sipangpt.local`) con rol `ADMIN`, lo que permite probar incluso si el sistema está en modo mantenimiento.

---

## 📡 2. Endpoint y Formato de Comunicación

* **URL:** `POST /api/chat`
* **Content-Type:** `application/json`
* **Tipo de Respuesta:** Streaming de texto (Vercel AI SDK UI Stream / SSE) con `Content-Type: text/plain; charset=utf-8` o `text/event-stream`.
* **Cabecera de Respuesta Importante:**
  * `x-conversation-id`: Devuelve el ID único de la conversación creada o actualizada en PostgreSQL.

---

## 📦 3. Estructura de la Solicitud (JSON Body)

### Opción A: Consulta Directa Simple (Recomendada para pruebas de carga)
```json
{
  "message": "¿Cuáles son los requisitos para la obtención del grado de bachiller?"
}
```

### Opción B: Conversación Multi-turno (Simulando un usuario real que continúa un chat)
Para continuar una conversación existente, envía el `conversationId` obtenido de la cabecera `x-conversation-id` de la respuesta anterior:
```json
{
  "conversationId": "cm1234567890abcdef",
  "message": "¿Y cuánto tiempo tengo para sustentar mi tesis?"
}
```

### Opción C: Selección Explícita de Modelo y Proveedor
```json
{
  "message": "Explícame el reglamento de disciplina estudiantil",
  "modelCode": "gemini-2.5-flash",
  "provider": "GEMINI"
}
```

### Campos Disponibles en el Body:
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `message` | `string` | Sí (o `messages`) | Texto de la consulta del usuario. |
| `messages` | `Array<UIMessage>` | Opcional | Historial estructurado (formato Vercel AI SDK). |
| `conversationId` | `string` | Opcional | ID del chat en DB. Si se omite, se crea uno nuevo. |
| `modelCode` | `string` | Opcional | Modelo a utilizar (por defecto `gemini-2.5-flash`). |
| `provider` | `string` | Opcional | `GEMINI`, `OPENAI`, `GROQ`, `ANTHROPIC`, `LOCAL_MAC`. |
| `id` | `string` | Opcional | ID del mensaje del usuario (si se pasa, debe ser un UUID único por petición). |
| `assistantId` | `string` | Opcional | ID del mensaje del asistente (si se pasa, debe ser un UUID único por petición). |

---

## ⚠️ 4. Buenas Prácticas para Pruebas de Carga

1. **Evitar IDs de Mensaje Fijos en Bucles:**
   - Si tu script envía `id` o `assistantId`, **nunca envíes un string fijo como `"test-id"`** en un bucle concurrente.
   - Lo más óptimo es **no enviar `id` ni `assistantId`** para que Prisma genere identificadores CUID automáticamente en cada inserción. Si tu cliente requiere enviarlos, genera un `crypto.randomUUID()` en cada iteración.
2. **Prueba de Creación de Conversaciones vs. Conversación Continua:**
   - **Prueba de estrés general:** No envíes `conversationId`. Cada petición creará una nueva conversación, midiendo el rendimiento completo del pipeline (creación de sesión sintética, generación de embedding RAG, búsqueda de similitud pgvector, streaming de LLM y registro de token usage).
   - **Prueba de chat largo:** Crea una conversación primero y reutiliza ese `conversationId` para medir el comportamiento con historial y límites de preguntas (máximo 20 por conversación).
3. **Consumo del Stream:**
   - La respuesta es un stream en tiempo real. Asegúrate de que tu script lea el body del stream hasta completarlo para registrar con fidelidad la latencia total (`totalDurationMs`) y el tiempo hasta el primer token (TTFT).

---

## 💻 5. Ejemplos de Implementación

### A. cURL
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: sipangpt-local-perf-key" \
  -d '{
    "message": "¿Cuáles son los requisitos para titularse?"
  }'
```

---

### B. Python (con `httpx` y soporte de streaming)
```python
import httpx
import sys

URL = "http://localhost:3000/api/chat"
HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": "sipangpt-local-perf-key",  # O el valor de INTERNAL_API_KEY
}
PAYLOAD = {
    "message": "¿Cómo tramito un certificado de estudios en la USS?",
}

with httpx.Client(timeout=60.0) as client:
    with client.stream("POST", URL, headers=HEADERS, json=PAYLOAD) as response:
        if response.status_code != 200:
            print(f"Error {response.status_code}: {response.text}")
            sys.exit(1)

        conv_id = response.headers.get("x-conversation-id")
        print(f"--- Conversación ID: {conv_id} ---")
        
        for chunk in response.iter_text():
            sys.stdout.write(chunk)
            sys.stdout.flush()
        print("\n--- Fin de respuesta ---")
```

---

### C. Node.js (Fetch nativo con streaming)
```javascript
const URL = 'http://localhost:3000/api/chat'

async function testChat() {
  const response = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'sipangpt-local-perf-key',
    },
    body: JSON.stringify({
      message: '¿Cuál es el procedimiento para solicitar rectificación de matrícula?',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Error HTTP ${response.status}:`, errorText)
    return
  }

  console.log('Conversación ID:', response.headers.get('x-conversation-id'))

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    process.stdout.write(decoder.decode(value))
  }
  console.log('\n[Stream completado]')
}

testChat()
```

---

### D. k6 (Prueba de Rendimiento y Concurrencia)

Crea un archivo `load-test.js`:

```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 5 },  // Ramp-up a 5 usuarios virtuales
    { duration: '1m', target: 10 },   // Carga constante de 10 usuarios virtuales
    { duration: '20s', target: 0 },   // Ramp-down a 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],  // Menos del 1% de errores
    http_req_duration: ['p(95)<15000'], // 95% de respuestas completas en menos de 15s
  },
}

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000'
const API_KEY = __ENV.API_KEY || 'sipangpt-local-perf-key'

const QUESTIONS = [
  '¿Cuáles son los requisitos para la obtención del grado de bachiller?',
  '¿Cómo solicitar la convalidación de cursos?',
  '¿Cuál es el costo de la matrícula extemporánea?',
  '¿Quiénes conforman el jurado de sustentación de tesis?',
]

export default function () {
  const randomQuestion = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    timeout: '60s',
  }

  const payload = JSON.stringify({
    message: randomQuestion,
  })

  const res = http.post(`${BASE_URL}/api/chat`, payload, params)

  check(res, {
    'status es 200': (r) => r.status === 200,
    'tiene x-conversation-id': (r) => r.headers['X-Conversation-Id'] !== undefined,
    'body no está vacío': (r) => r.body && r.body.length > 0,
  })

  sleep(1)
}
```

Para ejecutar la prueba con k6:
```bash
k6 run load-test.js
```

---

## 🚦 6. Códigos de Estado y Errores Esperados

| Código | Significado | Causa común y Solución |
| :---: | :--- | :--- |
| **200** | OK | Respuesta en streaming generándose exitosamente. |
| **400** | Bad Request | Mensaje vacío, excede `maxPromptChars` (2,000 caracteres) o superó el límite de 20 preguntas por chat. |
| **401** | Unauthorized | La cabecera `x-api-key` o `Authorization` no fue enviada o no coincide con la clave configurada. |
| **503** | Service Unavailable | Modo de mantenimiento activado por el Administrador (no afecta a llamadas con la API key interna porque tienen rol ADMIN). |

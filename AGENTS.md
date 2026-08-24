<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Protocolo y Guía de Base de Datos (Prisma 7 + PostgreSQL / Neon)

## ⚠️ Regla de Oro: Prevención de Pérdida de Datos
**NUNCA** ejecutar `npx prisma db push --force-reset` ni `npx prisma migrate reset` en bases de datos que contengan datos importantes. 
Para mantener la integridad de la base de datos y evitar tener que borrar tablas, siempre se debe usar el flujo de **Prisma Migrate**.

---

## 🛠️ Flujo Estándar para Modificar la Base de Datos

### Paso 1: Modificar el esquema
Edita únicamente los modelos o campos necesarios en `prisma/schema.prisma`.

### Paso 2: Crear y aplicar la migración en desarrollo
Ejecuta en la terminal:
```bash
npx prisma migrate dev --name <nombre_descriptivo_del_cambio>
```
*Ejemplos:*
- `npx prisma migrate dev --name add_user_role`
- `npx prisma migrate dev --name create_conversations_table`

**¿Qué hace este comando?**
1. Compara tu esquema actual con la base de datos.
2. Genera un archivo SQL versionado dentro de `prisma/migrations/<timestamp>_<nombre>/migration.sql`.
3. Aplica los cambios a la base de datos de desarrollo.
4. Si detecta que un cambio puede provocar pérdida de datos (ej. borrar una columna con datos), Prisma te advertirá **antes** de ejecutar nada.
5. Ejecuta `npx prisma generate` automáticamente.

---

### Paso 3: Casos Especiales (Cambios con riesgo de datos)

Si necesitas hacer cambios destructivos (renombrar una columna, cambiar un tipo incompatible) sin perder los datos existentes:

1. **Crear migración sin aplicarla de inmediato:**
   ```bash
   npx prisma migrate dev --create-only --name <nombre_del_cambio>
   ```
2. **Revisar y editar el archivo SQL generado:**
   Abre el archivo `prisma/migrations/.../migration.sql` y ajusta el SQL manualmente (por ejemplo, usando `ALTER TABLE ... RENAME COLUMN ...` en vez de `DROP COLUMN` + `ADD COLUMN`).
3. **Aplicar la migración personalizada:**
   ```bash
   npx prisma migrate dev
   ```

---

## 🚀 Despliegue en Producción / Staging (Vercel / CI-CD)

En entornos de producción nunca se usa `migrate dev`. Se utiliza:
```bash
npx prisma migrate deploy
```
Este comando únicamente ejecuta los scripts `.sql` pendientes sin alterar la estructura existente ni hacer preguntas interactivas.

---

## 📋 Comandos Rápidos de Diagnóstico

- **Ver estado de las migraciones:**
  ```bash
  npx prisma migrate status
  ```
- **Validar sintaxis del esquema:**
  ```bash
  npx prisma validate
  ```
- **Abrir interfaz visual de datos:**
  ```bash
  npx prisma studio
  ```

---

# 🎨 Guía de Tipografías y Fuentes (Tailwind CSS v4 + Next.js)

El proyecto utiliza dos fuentes locales variables configuradas en `app/fonts.ts` e inyectadas globalmente en `app/layout.tsx` y `app/globals.css`:

| Propósito | Fuente | Variable CSS | Clases Tailwind disponibles |
| :--- | :--- | :--- | :--- |
| **Texto general / Letras normales** | **Exo 2** (`Exo2-*.ttf`) | `--font-exo` | `font-sans`, `font-exo` *(por defecto en todo el body)* |
| **Títulos / Encabezados** | **Fraunces** (`Fraunces-*.ttf`) | `--font-frances` | `font-frances`, `font-fraunces`, `font-heading` |

### 📌 Reglas de Uso en Componentes y Páginas:

1. **Textos y Párrafos:**
   - La fuente por defecto de todo el documento es **Exo 2** (`font-sans`), por lo que no es estrictamente obligatorio añadir una clase para textos base, pero puedes usar `font-exo` o `font-sans` para ser explícito.
   ```tsx
   <p className="text-muted-foreground text-sm font-exo">
     Texto del párrafo usando Exo 2
   </p>
   ```

2. **Títulos y Encabezados:**
   - Siempre que se creen encabezados (`h1`, `h2`, `h3`, badges destacados, etc.), utilizar la clase `font-frances` o `font-heading`:
   ```tsx
   <h1 className="font-frances text-3xl font-bold tracking-tight text-foreground">
     Título Destacado con Fraunces
   </h1>
   ```

3. **Definición en Tailwind v4 (`app/globals.css`):**
   Las variables se encuentran mapeadas en `@theme inline` para que cualquier utilidad de fuente resuelva directamente a las fuentes locales de Next.js:
   ```css
   @theme inline {
     --font-sans: var(--font-exo), ui-sans-serif, system-ui, sans-serif;
     --font-exo: var(--font-exo), ui-sans-serif, system-ui, sans-serif;
     --font-heading: var(--font-frances), ui-serif, Georgia, serif;
     --font-frances: var(--font-frances), ui-serif, Georgia, serif;
     --font-fraunces: var(--font-frances), ui-serif, Georgia, serif;
   }
   ```



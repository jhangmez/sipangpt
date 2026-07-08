import os
import re
import markdown
import json
from typing import List, Dict, Any

# --- CONFIGURACIÓN ---
DIRECTORIO_CODIGO = "."  # Directorio raíz donde está tu código (cambiar si es diferente)
# ARCHIVO_SALIDA_MD = "anexo_codigo_fuente.md"  # Nombre del archivo Markdown de salida
EXCEPCIONES_CARPETAS = [".next", ".vscode", "node_modules", "prisma/migrations", ".env", "package-lock.json", ".git", "documento.py"]
EXCEPCIONES_EXTENSIONES = [".md", ".json", ".lock", ".example"]
ENCABEZADO_ARCHIVO = "## Archivo: `{}`\n\n"  # Formato del encabezado para cada archivo
ENCABEZADO_CODIGO = "```{}\n{}\n```\n\n" # Formato del bloque de código
FORMATO_COMENTARIO = "<!-- {} -->" # Para poder encontrar los comentarios
NOMBRE_PROYECTO = "SipanGPT"  # Si está vacío, usará el nombre del directorio
COMENTARIOS_ARCHIVOS = {
    ".env": "Variables de entorno (NO subir al repositorio)",
    ".env.example": "Ejemplo del archivo .env",
    ".eslintrc.json": "Configuración de ESLint",
    ".gitignore": "Archivos y directorios ignorados por Git",
    "package.json": "Información del proyecto y dependencias",
    "package-lock.json": "Bloqueo de versiones de dependencias",
    "tsconfig.json": "Configuración de TypeScript",
    "README.md": "Documentación principal del proyecto"
}
# --- FUNCIONES AUXILIARES ---

def es_excepcion(ruta: str) -> bool:
    """Verifica si una ruta (archivo o directorio) es una excepción."""
    for excepcion in EXCEPCIONES_CARPETAS:
        if excepcion in ruta and excepcion in ruta:
             return True
        if excepcion in ruta and os.path.isfile(ruta):
             return True
    for excepcion in EXCEPCIONES_EXTENSIONES:
        if ruta.endswith(excepcion):
            return True
    return False


def obtener_lenguaje(nombre_archivo: str) -> str:
    """Determina el lenguaje de programación basado en la extensión."""
    if nombre_archivo.endswith(".ts") or nombre_archivo.endswith(".tsx"):
        return "typescript"
    elif nombre_archivo.endswith(".js") or nombre_archivo.endswith(".jsx"):
        return "javascript"
    elif nombre_archivo.endswith(".py"):
        return "python"
    elif nombre_archivo.endswith(".css"):
        return "css"
    elif nombre_archivo.endswith(".json"):
        return "json"
    elif nombre_archivo.endswith(".md"):
        return "" # No se agrega el codigo fuente de md
    else:
        return ""  # Lenguaje desconocido

def analizar_archivo_json(ruta_completa: str) -> str:
    """Analiza archivos JSON y devuelve el contenido formateado."""
    try:
        with open(ruta_completa, "r", encoding="utf-8") as archivo:
            datos = json.load(archivo)
        return json.dumps(datos, indent=2)  # Formato JSON legible
    except json.JSONDecodeError as e:
        return f"Error al decodificar JSON: {e}"
    except Exception as e:
        return f"Error al leer el archivo JSON: {e}"

def extraer_comentarios(contenido: str) -> List[str]:
    """Extrae comentarios del código fuente (basado en patrones simples)."""
    comentarios = []
    for match in re.finditer(r"//.*|/\*.*?\*/|#.*", contenido, re.DOTALL):
        comentarios.append(match.group(0).strip())
    return comentarios

def procesar_archivo(ruta_completa: str) -> str:
    """Procesa un archivo, extrayendo el código y los comentarios."""
    try:
        with open(ruta_completa, "r", encoding="utf-8") as archivo:
            contenido = archivo.read()

        lenguaje = obtener_lenguaje(ruta_completa)
        if lenguaje == "":
           return "" # No hacer nada si es md

        codigo_formateado = ""
        if lenguaje == "json":
            codigo_formateado = analizar_archivo_json(ruta_completa)
        else:
            codigo_formateado = contenido

        comentarios = extraer_comentarios(contenido)
        comentarios_md = ""

        if comentarios:
            comentarios_md = "\n".join([FORMATO_COMENTARIO.format(c) for c in comentarios]) + "\n\n"

        return comentarios_md + ENCABEZADO_CODIGO.format(lenguaje, codigo_formateado)

    except UnicodeDecodeError:
        return "<!-- Error: No se pudo decodificar el archivo (UnicodeDecodeError) -->\n\n"
    except Exception as e:
        return f"<!-- Error al procesar el archivo: {e} -->\n\n"

def generar_estructura_directorios(directorio: str, nivel: int = 0, archivo_salida: Any = None, es_ultimo: bool = True, prefijo: str = "") -> None:
    """
    Genera la estructura de directorios en formato árbol.

    Args:
        directorio: Ruta del directorio a procesar
        nivel: Nivel actual de profundidad
        archivo_salida: Archivo donde escribir la salida
        es_ultimo: Indica si es el último elemento en el nivel actual
        prefijo: Prefijo acumulado para la línea actual
    """
    try:
        # Si estamos en el nivel 0, escribir el nombre del proyecto o directorio raíz
        if nivel == 0:
            archivo_salida.write("```plaintext\n")
            nombre_raiz = NOMBRE_PROYECTO if NOMBRE_PROYECTO else os.path.basename(os.path.abspath(directorio))
            archivo_salida.write(f"{nombre_raiz}\n")

        # Obtener lista de elementos no excluidos
        contenido = [item for item in sorted(os.listdir(directorio))
                    if not es_excepcion(os.path.join(directorio, item))]
    except OSError as e:
        print(f"Error al listar el directorio {directorio}: {e}")
        return

    # Para cada elemento en el directorio
    for i, item in enumerate(contenido):
        ruta_completa = os.path.join(directorio, item)
        es_ultimo_elemento = i == len(contenido) - 1

        # Determinar los símbolos correctos para el árbol
        if nivel == 0:
            nuevo_prefijo = ""
            conector = "├── " if not es_ultimo_elemento else "└── "
        else:
            nuevo_prefijo = prefijo + ("│   " if not es_ultimo else "    ")
            conector = "├── " if not es_ultimo_elemento else "└── "

        # Escribir la línea con el formato correcto
        if os.path.isdir(ruta_completa):
            archivo_salida.write(f"{prefijo}{conector}{item}/\n")
            # Procesar subdirectorio
            generar_estructura_directorios(
                ruta_completa,
                nivel + 1,
                archivo_salida,
                es_ultimo_elemento,
                nuevo_prefijo
            )
        else:
            # Agregar comentario si existe en el diccionario de comentarios
            comentario = ""
            if item in COMENTARIOS_ARCHIVOS:
                comentario = f" # {COMENTARIOS_ARCHIVOS[item]}"
            archivo_salida.write(f"{prefijo}{conector}{item}{comentario}\n")

    # Si estamos terminando el nivel inicial (0), cerrar el bloque de código
    if nivel == 0:
        archivo_salida.write("```\n\n")  # Fin del bloque de código

# --- MAIN ---
def main():
    """Función principal: recorre los archivos y genera el Markdown."""
    # Generar el nombre del archivo de salida
    nombre_proyecto_o_carpeta = NOMBRE_PROYECTO if NOMBRE_PROYECTO else os.path.basename(os.path.abspath(DIRECTORIO_CODIGO))
    ARCHIVO_SALIDA_MD = f"{nombre_proyecto_o_carpeta}_codigo_fuente.md"
    with open(ARCHIVO_SALIDA_MD, "w", encoding="utf-8") as archivo_salida:

        archivo_salida.write("# Anexos\n\n")
        # 1. Estructura del Código
        archivo_salida.write("## 1. Estructura del Código\n\n")
        generar_estructura_directorios(DIRECTORIO_CODIGO, 0, archivo_salida)
        archivo_salida.write("\n\n## 2. Código Fuente\n\n")

        # 2. Código Fuente
        for raiz, _, archivos in os.walk(DIRECTORIO_CODIGO):
            # Verifica si la ruta actual es una excepción
            if es_excepcion(raiz):
                continue

            for archivo in archivos:
                ruta_completa = os.path.join(raiz, archivo)

                # Verifica si el archivo es una excepción
                if es_excepcion(ruta_completa):
                    continue

                # Procesa el archivo y escribe en el Markdown de salida
                contenido_archivo = procesar_archivo(ruta_completa)

                if(contenido_archivo):
                    nombre_archivo_relativo = os.path.relpath(ruta_completa, DIRECTORIO_CODIGO)
                    archivo_salida.write(f"• `{nombre_archivo_relativo}`\n")
                    archivo_salida.write(contenido_archivo)

    print(f"Archivo Markdown generado: {ARCHIVO_SALIDA_MD}")

if __name__ == "__main__":
    main()
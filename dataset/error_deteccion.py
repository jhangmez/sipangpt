import json

def detectar_problemas_jsonl(ruta_archivo, campos_esperados):
    """
    Detecta problemas en un archivo JSONL basado en campos inesperados.

    :param ruta_archivo: Ruta del archivo JSONL.
    :param campos_esperados: Lista de campos esperados en la estructura.
    """
    with open(ruta_archivo, "r", encoding="utf-8") as archivo:
        for i, linea in enumerate(archivo, start=1):
            try:
                # Cargar el JSON de la línea
                registro = json.loads(linea.strip())
                # Verificar que 'conversations' exista y sea una lista
                if "conversations" in registro and isinstance(registro["conversations"], list):
                    for mensaje in registro["conversations"]:
                        # Verificar que sea un diccionario
                        if not isinstance(mensaje, dict):
                            print(f"Línea {i}: Un elemento en 'conversations' no es un diccionario.")
                            continue
                        # Detectar campos inesperados
                        campos_actuales = set(mensaje.keys())
                        campos_incorrectos = campos_actuales - set(campos_esperados)
                        if campos_incorrectos:
                            print(f"Línea {i}: Campos inesperados encontrados: {campos_incorrectos}")
                else:
                    print(f"Línea {i}: Falta 'conversations' o no es una lista.")
            except json.JSONDecodeError as e:
                print(f"Línea {i}: Error al decodificar JSON - {e}")
            except Exception as e:
                print(f"Línea {i}: Error inesperado - {e}")

# Especificar los campos esperados en cada mensaje
campos_esperados = ["from", "value"]

# Ruta del archivo JSONL
ruta_archivo = "./data.jsonl"

# Ejecutar el análisis
detectar_problemas_jsonl(ruta_archivo, campos_esperados)

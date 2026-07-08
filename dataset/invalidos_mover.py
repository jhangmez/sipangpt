import os
from pathlib import Path
import glob
import json
from typing import Set

def append_jsonl_files(source_dir: str, dest_dir: str, pattern: str) -> None:
    """
    Añade el contenido de archivos JSONL desde el directorio fuente al final de los archivos
    en el directorio destino, manteniendo el contenido existente.
    
    Args:
        source_dir: Directorio fuente (generacion/invalid)
        dest_dir: Directorio destino (limpieza/invalid)
        pattern: Patrón de los archivos a procesar
    """
    source_path = Path(source_dir)
    dest_path = Path(dest_dir)
    
    # Crear directorio destino si no existe
    dest_path.mkdir(parents=True, exist_ok=True)
    
    # Obtener lista de archivos fuente
    source_files = glob.glob(str(source_path / pattern))
    
    if not source_files:
        print(f"No se encontraron archivos con el patrón {pattern} en {source_dir}")
        return
    
    print(f"Encontrados {len(source_files)} archivos para procesar")
    
    # Procesar cada archivo fuente
    for source_file in source_files:
        file_name = Path(source_file).name
        dest_file = dest_path / file_name
        
        try:
            print(f"Procesando: {file_name}")
            
            # Leer todo el contenido del archivo fuente
            with open(source_file, 'r', encoding='utf-8') as source:
                new_content = source.read().strip()  # strip() para eliminar espacios extra al final
            
            if dest_file.exists():
                # Si el archivo destino existe, añadir una línea en blanco y el nuevo contenido
                with open(dest_file, 'a', encoding='utf-8') as dest:
                    dest.write(new_content)
                print(f"Contenido añadido al final de: {file_name}")
            else:
                # Si el archivo no existe, crear uno nuevo
                with open(dest_file, 'w', encoding='utf-8') as dest:
                    dest.write(new_content)
                print(f"Creado nuevo archivo: {file_name}")

            # Eliminar el archivo fuente después de procesarlo
            os.remove(source_file)
            print(f"Eliminado archivo fuente: {file_name}")

        except Exception as e:
            print(f"Error procesando {file_name}: {str(e)}")

if __name__ == "__main__":
    # Definir las rutas
    generacion_invalid = "generacion/invalid"
    limpieza_invalid = "limpieza/invalid"
    file_pattern = "invalid_conversations*.jsonl"

    try:
        append_jsonl_files(generacion_invalid, limpieza_invalid, file_pattern)
        print("Proceso completado exitosamente")
    except Exception as e:
        print(f"Error durante la ejecución: {str(e)}")
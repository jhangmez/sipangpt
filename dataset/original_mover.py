import json
from pathlib import Path
import logging
from typing import Union, Generator
import sys
from tqdm import tqdm

def setup_logging():
    """Configura el logging básico"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

def read_jsonl_in_chunks(file_path: Union[str, Path], chunk_size: int = 1000) -> Generator[list, None, None]:
    """
    Lee el archivo JSONL en chunks para manejar archivos grandes eficientemente.
    
    Args:
        file_path: Ruta al archivo JSONL
        chunk_size: Número de líneas a leer por chunk
    
    Yields:
        Lista de objetos JSON por cada chunk
    """
    chunk = []
    try:
        # Contar el número total de líneas para tqdm
        total_lines = sum(1 for _ in open(file_path, 'r', encoding='utf-8'))
        
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in tqdm(file, total=total_lines, desc="Procesando líneas"):
                try:
                    json_obj = json.loads(line.strip())
                    chunk.append(json_obj)
                    
                    if len(chunk) >= chunk_size:
                        yield chunk
                        chunk = []
                except json.JSONDecodeError as e:
                    logging.error(f"Error al decodificar JSON: {e}")
                    continue
                
            if chunk:  # Yield el último chunk si existe
                yield chunk
    except Exception as e:
        logging.error(f"Error al leer el archivo {file_path}: {e}")
        raise

def append_to_jsonl(data: list, output_file: Union[str, Path]):
    """
    Añade una lista de objetos JSON al archivo de salida.
    
    Args:
        data: Lista de objetos JSON a escribir
        output_file: Ruta al archivo de salida
    """
    try:
        with open(output_file, 'a', encoding='utf-8') as file:
            for item in data:
                json_line = json.dumps(item, ensure_ascii=False)
                file.write(json_line + '\n')
    except Exception as e:
        logging.error(f"Error al escribir en el archivo {output_file}: {e}")
        raise

def clear_file(file_path: Union[str, Path]):
    """
    Vacía el contenido del archivo.

    Args:
        file_path: Ruta al archivo a vaciar
    """
    try:
        open(file_path, 'w').close()
        logging.info(f"Archivo {file_path} vaciado exitosamente")
    except Exception as e:
        logging.error(f"Error al vaciar el archivo {file_path}: {e}")
        raise

def transfer_jsonl_content(archivo_entrada: Union[str, Path], archivo_salida: Union[str, Path], chunk_size: int = 1000):
    """
    Transfiere el contenido de un archivo JSONL a otro y vacía el archivo de entrada.

    Args:
        archivo_entrada: Ruta al archivo de entrada
        archivo_salida: Ruta al archivo de salida
        chunk_size: Tamaño del chunk para procesar
    """
    setup_logging()

    # Convertir rutas a objetos Path
    archivo_entrada = Path(archivo_entrada)
    archivo_salida = Path(archivo_salida)

    # Verificar que el archivo de entrada existe
    if not archivo_entrada.exists():
        raise FileNotFoundError(f"El archivo de entrada {archivo_entrada} no existe")

    # Crear el archivo de salida si no existe
    archivo_salida.touch(exist_ok=True)

    logging.info(f"Iniciando transferencia de {archivo_entrada} a {archivo_salida}")

    try:
        for chunk in read_jsonl_in_chunks(archivo_entrada, chunk_size):
            append_to_jsonl(chunk, archivo_salida)

        # Vaciar el archivo de entrada después de la transferencia exitosa
        clear_file(archivo_entrada)
        logging.info("Transferencia completada exitosamente")

    except Exception as e:
        logging.error(f"Error durante la transferencia: {e}")
        raise

if __name__ == "__main__":
    try:
        archivo_entrada = './pre_data.jsonl'
        archivo_salida = './data.jsonl'

        transfer_jsonl_content(archivo_entrada, archivo_salida)
    except Exception as e:
        logging.error(f"Error en la ejecución del script: {e}")
        sys.exit(1)
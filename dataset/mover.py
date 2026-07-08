import json
import os
import re
import glob
import sys

'''
def validate_conversation_structure(conversation):
    if not isinstance(conversation, list):
        return False

    for item in conversation:
        if not isinstance(item, dict) or set(item.keys()) != {'from', 'value'}:
            return False
        if not isinstance(item['from'], str) or not isinstance(item['value'], str):
            return False
        if item['from'] not in ['system', 'human', 'gpt']:
            return False

    return True

def validate_conversation_order(conversation):
    if not conversation or conversation[0]['from'] != 'system':
        return False

    previous_from = conversation[0]['from']

    for idx, item in enumerate(conversation[1:], 1):
        current_from = item['from']
        if current_from == previous_from:
            return False
        elif current_from == 'human':
            if idx % 2 == 0:
                return False
        elif current_from == 'gpt':
            if idx % 2 != 0:
                return False
        previous_from = current_from

    return True
'''

def validate_conversation_structure(conversation):
    """
    Validación mejorada de la estructura de la conversación
    """
    if not isinstance(conversation, list) or len(conversation) < 2:  # Mínimo system + una interacción
        return False

    # Verificar que cada item tenga la estructura correcta
    for item in conversation:
        if not isinstance(item, dict) or set(item.keys()) != {'from', 'value'}:
            return False
        if not isinstance(item['from'], str) or not isinstance(item['value'], str):
            return False
        if item['from'] not in ['system', 'human', 'gpt']:
            return False

    return True

def validate_conversation_order(conversation):
    """
    Validación mejorada del orden de la conversación
    """
    if not conversation:
        return False

    # Debe comenzar con system
    if conversation[0]['from'] != 'system':
        return False

    # Si solo hay system, es válido
    if len(conversation) == 1:
        return True

    # Verificar el patrón alternado después de system
    expected_pattern = ['human', 'gpt']
    pattern_index = 0

    for conv in conversation[1:]:
        if conv['from'] != expected_pattern[pattern_index]:
            return False
        pattern_index = (pattern_index + 1) % 2

    # Verificar que termine en gpt
    if conversation[-1]['from'] != 'gpt':
        return False

    return True

def process_jsonl(input_files, output_file, unformatted_file):
    # First, read existing unformatted conversations
    existing_unformatted = []
    if os.path.exists(unformatted_file):
        with open(unformatted_file, 'r', encoding='utf-8') as file:
            existing_unformatted = file.readlines()

    valid_lines = []
    invalid_lines = {}
    unformatted_lines = existing_unformatted.copy()

    try:
        for input_file in input_files:
            current_invalid_lines = []

            with open(input_file, 'r', encoding='utf-8') as file:
                for line in file:
                    try:
                        json_data = json.loads(line.strip())
                        if isinstance(json_data, dict) and "conversations" in json_data:
                            conversations = json_data["conversations"]
                            if validate_conversation_structure(conversations) and validate_conversation_order(conversations):
                                valid_lines.append(line)
                            else:
                                unformatted_lines.append(line)
                        else:
                            current_invalid_lines.append(line)
                    except json.JSONDecodeError:
                        current_invalid_lines.append(line)

            invalid_lines[input_file] = current_invalid_lines

        # Write valid lines to output file
        with open(output_file, 'a', encoding='utf-8') as file:
            file.writelines(valid_lines)

        # Write unformatted lines to unformatted file
        with open(unformatted_file, 'w', encoding='utf-8') as file:
            file.writelines(unformatted_lines)

        # Write invalid lines back to their original files
        for input_file, lines in invalid_lines.items():
            with open(input_file, 'w', encoding='utf-8') as file:
                file.writelines(lines)

        print(f"Primer proceso completado.")
        print(f"{len(valid_lines)} lineas validas movidas a {output_file}")
        print(f"{len(unformatted_lines)} lineas sin formato en {unformatted_file}")
        print("---------------------")
        for input_file, lines in invalid_lines.items():
            print(f"{len(lines)} lineas invalidas en {input_file}")

        # Secondary verification of unformatted_conversations.jsonl
        print(f"\nRealizar una verificación secundaria en {unformatted_file}...")
        newly_valid_lines = []
        remaining_unformatted_lines = []

        with open(unformatted_file, 'r', encoding='utf-8') as file:
            for line in file:
                try:
                    json_data = json.loads(line.strip())
                    if isinstance(json_data, dict) and "conversations" in json_data:
                        conversations = json_data["conversations"]
                        if validate_conversation_structure(conversations) and validate_conversation_order(conversations):
                            newly_valid_lines.append(line)
                        else:
                            remaining_unformatted_lines.append(line)
                    else:
                        remaining_unformatted_lines.append(line)
                except json.JSONDecodeError:
                    remaining_unformatted_lines.append(line)

        # Add newly validated lines to the output file
        with open(output_file, 'a', encoding='utf-8') as file:
            file.writelines(newly_valid_lines)

        # Update unformatted_conversations.jsonl
        with open(unformatted_file, 'w', encoding='utf-8') as file:
            file.writelines(remaining_unformatted_lines)

        print(f"Segundo proceso de verificación completado.")
        print(f"{len(newly_valid_lines)} lineas adicionales validas movidas a{output_file}")
        print(f"{len(remaining_unformatted_lines)} lineas aun sin formato en {unformatted_file}")

    except IOError as e:
        print(f"I/O Error: {e}")
    except Exception as e:
        print(f"Unknown error: {e}")

'''
# Script usage
# input_pattern = './limpieza/invalid/invalid_conversations*.jsonl'
input_pattern = './limpieza/valid/valid_conversations*.jsonl'
output_file = 'pre_data.jsonl'
unformatted_file = './limpieza/output/sin_formato.jsonl'

input_files = glob.glob(input_pattern)

if not os.path.exists(output_file):
    open(output_file, 'w').close()

if not os.path.exists(os.path.dirname(unformatted_file)):
    os.makedirs(os.path.dirname(unformatted_file))

if not os.path.exists(unformatted_file):
    open(unformatted_file, 'w').close()

process_jsonl(input_files, output_file, unformatted_file)
'''

# --- Configuración de input_pattern según los argumentos ---
if len(sys.argv) > 1:
    arg = sys.argv[1].lower()
    if arg == "validos":
        input_pattern = './limpieza/valid/valid_conversations*.jsonl'
    elif arg == "invalidos":
        input_pattern = './limpieza/invalid/invalid_conversations*.jsonl'
    else:
        print(f"Argumento no reconocido: {arg}. Usa 'validos' o 'invalidos'.")
        sys.exit(1)
else:
    # Por defecto, usar archivos inválidos
    input_pattern = './limpieza/invalid/invalid_conversations*.jsonl'

output_file = 'pre_data.jsonl'
unformatted_file = './limpieza/output/sin_formato.jsonl'

# --- Verificación de existencia de archivos de salida ---
input_files = glob.glob(input_pattern)

if not os.path.exists(output_file):
    open(output_file, 'w').close()

if not os.path.exists(os.path.dirname(unformatted_file)):
    os.makedirs(os.path.dirname(unformatted_file))

if not os.path.exists(unformatted_file):
    open(unformatted_file, 'w').close()

process_jsonl(input_files, output_file, unformatted_file)
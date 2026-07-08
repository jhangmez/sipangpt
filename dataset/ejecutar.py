import time
import json
import random
import re
import signal
import sys
import os
from concurrent.futures import ThreadPoolExecutor
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
import urllib.request
import ctypes
from ctypes import wintypes

# Prevenir que Windows entre en modo de suspensión
ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002

# Configuración de selectores actualizados
SELECTORS = {
    "input_field": "textarea.query-box-input",
    "submit_button": "button.submit-button",
    "chat_container": "div.chat-message-container",
    "loading_component": "loading-component",
    "response_content": "code",
    "chrome_error": "heading-1",  # Selector para el mensaje de error de Chrome
    "google_accounts": "accounts.google.com"  # URL parcial para detectar redirección a Google Accounts
}

# Número de páginas en paralelo (ajustable)
NUM_PAGES = 1

# Variable global para controlar la ejecución
running = True

def prevent_sleep_mode():
    """Previene que Windows entre en modo de suspensión."""
    try:
        ctypes.windll.kernel32.SetThreadExecutionState(
            ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
        )
        print("Modo de suspensión desactivado")
    except Exception as e:
        print(f"No se pudo desactivar el modo de suspensión: {e}")

def restore_sleep_mode():
    """Restaura la configuración normal de energía."""
    try:
        ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS)
        print("Configuración de energía restaurada")
    except Exception as e:
        print(f"Error al restaurar la configuración de energía: {e}")

def set_zoom_level(driver, zoom_level=33):
    """Establece el nivel de zoom en la página."""
    try:
        driver.execute_script(f"document.body.style.zoom = '{zoom_level}%'")
        print(f"Zoom establecido a {zoom_level}%")
    except Exception as e:
        print(f"Error al establecer el zoom: {e}")
        try:
            # Método alternativo usando Chrome DevTools Protocol
            driver.execute_cdp_cmd('Emulation.setPageScaleFactor', {'pageScaleFactor': zoom_level/100})
            print(f"Zoom establecido a {zoom_level}% usando CDP")
        except Exception as e2:
            print(f"Error al establecer el zoom usando CDP: {e2}")

def create_required_directories():
    """Crea las carpetas necesarias si no existen."""
    directories = ['./generacion/valid', './generacion/invalid', './errors']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    print("Directorios necesarios creados o verificados.")

def check_internet_connection():
    """Verifica la conexión a Internet."""
    try:
        urllib.request.urlopen('http://www.google.com', timeout=1)
        return True
    except:
        return False

def wait_for_internet():
    """Espera hasta que haya conexión a Internet."""
    while not check_internet_connection():
        print("Sin conexión a Internet. Esperando reconexión...")
        time.sleep(5)
    print("Conexión a Internet restaurada.")

def signal_handler(signum, frame):
    global running
    print("\nRecibida señal de interrupción. Cerrando los procesos...")
    running = False

def handle_chrome_error(driver, page_num):
    """Maneja errores de Chrome y problemas de conexión."""
    try:
        error_element = driver.find_element(By.ID, SELECTORS["chrome_error"])
        if error_element and "sin conexión" in error_element.text.lower():
            print(f"Página {page_num}: Detectado error de conexión en Chrome.")
            wait_for_internet()
            driver.refresh()
            return True
    except NoSuchElementException:
        return False
    return False

def check_google_accounts_redirect(driver, page_num):
    """Verifica si hay redirección a Google Accounts."""
    if SELECTORS["google_accounts"] in driver.current_url:
        print(f"\nEl navegador {page_num} solicita ingresar a la cuenta de Google.")
        return True
    return False

def attach_to_browser(debug_port):
    options = Options()
    options.add_experimental_option("debuggerAddress", f"localhost:{debug_port}")
    try:
        driver = webdriver.Chrome(options=options)
        driver.title  # Intentar una acción simple para verificar la conexión
        print(f"Conexión exitosa al puerto {debug_port}")
        return driver
    except WebDriverException as e:
        print(f"Error al conectar al puerto {debug_port}: {str(e)}")
        return None

def send_prompt(driver, prompt, selectors):
    try:
        input_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selectors["input_field"]))
        )

        driver.execute_script("""
            var textarea = arguments[0];
            textarea.focus();
            textarea.click();
            var event = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: '.'
            });
            textarea.dispatchEvent(event);
            textarea.value = '';
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.value = arguments[1];
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        """, input_field, prompt)

        submit_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, selectors["submit_button"]))
        )
        driver.execute_script("arguments[0].click();", submit_button)
    except NoSuchElementException:
        print("Elemento no encontrado. Actualizando página...")
        driver.refresh()
        time.sleep(5)
        return False
    except Exception as e:
        print(f"Error al enviar prompt: {str(e)}")
        return False
    return True

def wait_for_response(driver, selectors):
    try:
        chat_container = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selectors["chat_container"]))
        )
        WebDriverWait(chat_container, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selectors["loading_component"]))
        )
        WebDriverWait(chat_container, 300).until_not(
            EC.presence_of_element_located((By.CSS_SELECTOR, selectors["loading_component"]))
        )
        time.sleep(random.uniform(1, 3))
        return chat_container
    except TimeoutException as e:
        print(f"Tiempo de espera agotado: {str(e)}")
        return None
    except Exception as e:
        print(f"Error al esperar respuesta: {str(e)}")
        return None

def get_response(chat_container, selectors):
    try:
        code_element = chat_container.find_element(By.CSS_SELECTOR, selectors["response_content"])
        return code_element.text
    except NoSuchElementException:
        print("Elemento de código no encontrado. Actualizando página...")
        return None
    except Exception as e:
        print(f"Error al obtener respuesta: {str(e)}")
        return None

def clean_content(content):
    pattern = r'[\[\(](?:\d+(?:-\d+)?(?:,\s*)?)+[\]\)]'
    return re.sub(pattern, '', content).strip()

def is_valid_jsonl(json_string):
    try:
        json_obj = json.loads(json_string)
        if not isinstance(json_obj, dict) or 'conversations' not in json_obj:
            return False
        if not isinstance(json_obj['conversations'], list) or len(json_obj['conversations']) == 0:
            return False
        for item in json_obj['conversations']:
            if not isinstance(item, dict) or 'from' not in item or 'value' not in item:
                return False
        return json.dumps(json_obj, ensure_ascii=False, separators=(',', ':'))
    except json.JSONDecodeError:
        return False

def save_conversation(conversation, filename):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'a', encoding='utf-8') as f:
        f.write(conversation + '\n')

def process_page(page_num, url, prompt, debug_port):
    global running
    driver = attach_to_browser(debug_port)
    if not driver:
        print(f"No se pudo iniciar el navegador para la página {page_num}. Saliendo del proceso.")
        return

    print(f"Iniciando proceso para la página {page_num} en el puerto {debug_port}")
    driver.get(url)

    # Establecer zoom al 33%
    # set_zoom_level(driver)

    # Verificar redirección a Google Accounts
    if check_google_accounts_redirect(driver, page_num):
        return

    valid_conversations = set()
    invalid_conversations = set()
    consecutive_invalid = 0
    consecutive_duplicate_invalid = 0
    last_activity_time = time.time()

    try:
        while running:
            try:
                current_time = time.time()
                # Verificar si han pasado más de 5 minutos sin actividad
                if current_time - last_activity_time > 300:  # 5 minutos
                    print(f"Página {page_num}: Reactivando después de inactividad...")
                    driver.refresh()
                    # set_zoom_level(driver)  # Reestablecer zoom después del refresh
                    last_activity_time = current_time

                # Verificar conexión y errores de Chrome
                if handle_chrome_error(driver, page_num):
                    continue

                if not send_prompt(driver, prompt, SELECTORS):
                    continue

                chat_container = wait_for_response(driver, SELECTORS)

                if chat_container:
                    last_activity_time = time.time()
                    response = get_response(chat_container, SELECTORS)

                    if response:
                        cleaned_response = clean_content(response)
                        valid_jsonl = is_valid_jsonl(cleaned_response)

                        if valid_jsonl:
                            if valid_jsonl not in valid_conversations:
                                valid_conversations.add(valid_jsonl)
                                save_conversation(valid_jsonl, f'./generacion/valid/valid_conversations{page_num}.jsonl')
                                consecutive_invalid = 0
                                consecutive_duplicate_invalid = 0
                                print(f"Página {page_num}: Conversación válida guardada. Total: {len(valid_conversations)}")
                            else:
                                print(f"Página {page_num}: Conversación duplicada. Actualizando la página...")
                                driver.refresh()
                                consecutive_invalid = 0
                                consecutive_duplicate_invalid = 0
                        else:
                            if cleaned_response not in invalid_conversations:
                                invalid_conversations.add(cleaned_response)
                                save_conversation(cleaned_response, f'./generacion/invalid/invalid_conversations{page_num}.jsonl')
                                print(f"Página {page_num}: Respuesta inválida guardada para revisión manual.")
                                consecutive_invalid += 1
                                consecutive_duplicate_invalid = 0
                            else:
                                print(f"Página {page_num}: Respuesta inválida duplicada. Incrementando contador...")
                                consecutive_duplicate_invalid += 1

                            if consecutive_invalid >= 2 or consecutive_duplicate_invalid >= 1:
                                print(f"Página {page_num}: Dos conversaciones inválidas consecutivas o dos respuestas inválidas duplicadas. Actualizando la página...")
                                driver.refresh()
                                consecutive_invalid = 0
                                consecutive_duplicate_invalid = 0

                time.sleep(random.uniform(4, 11))

            except Exception as e:
                error_msg = f"Página {page_num} - Error: {str(e)}"
                print(error_msg)
                save_conversation(error_msg, f'./errors/errors{page_num}.jsonl')
                if isinstance(e, NoSuchElementException):
                    print(f"Página {page_num}: Elemento no encontrado. Actualizando página...")
                    driver.refresh()
                    # set_zoom_level(driver)  # Reestablecer zoom después del refresh
                time.sleep(15)

    finally:
        print(f"Cerrando el navegador para la página {page_num}")
        driver.quit()

# Template JSON base que se reutilizará
JSON_TEMPLATE  = """{"conversations": [{ "from": "system", "value": "Eres SipánGPT, un asistente de inteligencia artificial encargado de brindar información relacionada a la Universidad Señor de Sipán, una universidad privada ubicada en Km 5 Carretera a Pimentel, Chiclayo, Perú.\\n" },{ "from": "human", "value": "Hola, ---PREGUNTA DE LA PERSONA---" },{ "from": "gpt", "value": "---RESPUESTA DEL CHATBOT SipánGPT---" },{ "from": "human", "value": "--- SIGUE CON LAS PREGUNTAS DE LA PERSONA---" },{ "from": "gpt", "value": "---SIGUE CON LAS RESPUESTAS DEL CHATBOT SipánGPT---" }]}"""
JSON_TEMPLATE1 = """{"conversations": [{ "from": "system", "value": "Eres SipánGPT, un asistente de inteligencia artificial encargado de brindar información relacionada especializado en la Facultad de Ciencias de la Salud de la Universidad Señor de Sipán, una universidad privada ubicada en Km 5 Carretera a Pimentel, Chiclayo, Perú.\\n" },{ "from": "human", "value": "Hola, ---PREGUNTA DE LA PERSONA---" },{ "from": "gpt", "value": "---RESPUESTA DEL CHATBOT SipánGPT---" },{ "from": "human", "value": "--- SIGUE CON LAS PREGUNTAS DE LA PERSONA---" },{ "from": "gpt", "value": "---SIGUE CON LAS RESPUESTAS DEL CHATBOT SipánGPT---" }]}"""
JSON_TEMPLATE2 = """{"conversations": [{ "from": "system", "value": "Eres SipánGPT, un asistente de inteligencia artificial encargado de brindar información relacionada especializado en la Facultad de Ciencias Empresariales de la Universidad Señor de Sipán, una universidad privada ubicada en Km 5 Carretera a Pimentel, Chiclayo, Perú.\\n" },{ "from": "human", "value": "Hola, ---PREGUNTA DE LA PERSONA---" },{ "from": "gpt", "value": "---RESPUESTA DEL CHATBOT SipánGPT---" },{ "from": "human", "value": "--- SIGUE CON LAS PREGUNTAS DE LA PERSONA---" },{ "from": "gpt", "value": "---SIGUE CON LAS RESPUESTAS DEL CHATBOT SipánGPT---" }]}"""
JSON_TEMPLATE3 = """{"conversations": [{ "from": "system", "value": "Eres SipánGPT, un asistente de inteligencia artificial encargado de brindar información relacionada especializado en la Facultad de Derecho y Humanidades de la Universidad Señor de Sipán, una universidad privada ubicada en Km 5 Carretera a Pimentel, Chiclayo, Perú.\\n" },{ "from": "human", "value": "Hola, ---PREGUNTA DE LA PERSONA---" },{ "from": "gpt", "value": "---RESPUESTA DEL CHATBOT SipánGPT---" },{ "from": "human", "value": "--- SIGUE CON LAS PREGUNTAS DE LA PERSONA---" },{ "from": "gpt", "value": "---SIGUE CON LAS RESPUESTAS DEL CHATBOT SipánGPT---" }]}"""
JSON_TEMPLATE4 = """{"conversations": [{ "from": "system", "value": "Eres SipánGPT, un asistente de inteligencia artificial encargado de brindar información relacionada especializado en la Facultad de Ingeniería, Arquitectura y Urbanismo de la Universidad Señor de Sipán, una universidad privada ubicada en Km 5 Carretera a Pimentel, Chiclayo, Perú.\\n" },{ "from": "human", "value": "Hola, ---PREGUNTA DE LA PERSONA---" },{ "from": "gpt", "value": "---RESPUESTA DEL CHATBOT SipánGPT---" },{ "from": "human", "value": "--- SIGUE CON LAS PREGUNTAS DE LA PERSONA---" },{ "from": "gpt", "value": "---SIGUE CON LAS RESPUESTAS DEL CHATBOT SipánGPT---" }]}"""
JSON_TEMPLATE5 = """{"conversations": [{ "from": "system", "value": "Eres SipánGPT, un asistente de inteligencia artificial encargado de brindar información relacionada especializado en Carreras para gente con experiencia de la Universidad Señor de Sipán, una universidad privada ubicada en Km 5 Carretera a Pimentel, Chiclayo, Perú.\\n" },{ "from": "human", "value": "Hola, ---PREGUNTA DE LA PERSONA---" },{ "from": "gpt", "value": "---RESPUESTA DEL CHATBOT SipánGPT---" },{ "from": "human", "value": "--- SIGUE CON LAS PREGUNTAS DE LA PERSONA---" },{ "from": "gpt", "value": "---SIGUE CON LAS RESPUESTAS DEL CHATBOT SipánGPT---" }]}"""
JSON_TEMPLATE6 = """{"conversations": [{ "from": "system", "value": "Eres SipánGPT, un asistente de inteligencia artificial encargado de brindar información relacionada al aula virtual(AulaUSS) y al campus(SEUSS) de una universidad privada ubicada en Km 5 Carretera a Pimentel, Chiclayo, Perú.\\n" }{ "from": "human", "value": "Hola, ---PREGUNTA DEL ESTUDIANTE---" },{ "from": "gpt", "value": "---RESPUESTA DEL CHATBOT SipánGPT---" },{ "from": "human", "value": "--- SIGUE CON LAS PREGUNTAS DEL ESTUDIANTE---" },{ "from": "gpt", "value": "---SIGUE CON LAS RESPUESTAS DEL CHATBOT SipánGPT---" }]}"""
JSON_TEMPLATE7 = """{"conversations": [{ "from": "system", "value": "Eres SipánGPT, un asistente de inteligencia artificial encargado de brindar información relacionada al reglamento de cobranzas darás definiciones y diversos costos o precios EN SOLES (S/.) de servicios que ofrece la universidad señor de sipán\\n" },{ "from": "human", "value": "Hola, ---PREGUNTA DEL ESTUDIANTE---" },{ "from": "gpt", "value": "---RESPUESTA DEL CHATBOT SipánGPT---" },{ "from": "human", "value": "--- SIGUE CON LAS PREGUNTAS DEL ESTUDIANTE---" },{ "from": "gpt", "value": "---SIGUE CON LAS RESPUESTAS DEL CHATBOT SipánGPT---" }]}"""
JSON_TEMPLATE8  = """{"conversations": [{ "from": "system", "value": "Eres SipánGPT, un asistente de inteligencia artificial encargado de brindar información relacionada a la Universidad Señor de Sipán, Tratarás de entender preguntas o mensajes ambiguos que brinda la persona si no captas le sugerirás preguntas relacionadas.\\n" },{ "from": "human", "value": "hola, ---PREGUNTA DE LA PERSONA---" },{ "from": "gpt", "value": "---RESPUESTA DEL CHATBOT SipánGPT---" },{ "from": "human", "value": "--- SIGUE CON LAS PREGUNTAS DE LA PERSONA---" },{ "from": "gpt", "value": "---SIGUE CON LAS RESPUESTAS DEL CHATBOT SipánGPT---" }]}"""

PORT_NUMER = 9222

def main():
    # Prevenir que el sistema entre en modo de suspensión
    prevent_sleep_mode()

    try:
        page_configs = [
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9222
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9223
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9224
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9225
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9226
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9227
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9228
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9229
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9230
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9231
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9232
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9233
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9234
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9235
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9236
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9237
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9238
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9239
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9240
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9241
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9242
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9243
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9244
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9245
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9246
        },
        {
            "url": "https://notebooklm.google.com/notebook/97550cea-f549-459c-87ed-976236387741",
            "prompt": f"""Imagina que eres un estudiante de la universidad(no digas exactamente esto, puedes decir variaciones) y preguntas a SipánGPT( QUE ES un chatbot que solo responde preguntas sobre la universidad señor de sipán) sobre preguntas o mensajes ambiguos o poco entendibles en general, responde intentando entender a que se refiere con lo que menciono o por el contrario dar una respuesta sugiriendo una pregunta relacionada a lo que la persona trata de pedir información, basate en tus fuentes (HAZ QUE SEA COMO UNA CONVERSACION con al menos 100 interacciones en ambas partes ENTRE UN ESTUDIANTE(EL QUE VA PREGUNTAR) Y EL CHATBOT DE LA USS llamado SipánGPT(EL QUE VA RESPONDER))
### Estructura JSON esperada:{JSON_TEMPLATE8}""",
            "debug_port": 9247
        },
    ]

        with ThreadPoolExecutor(max_workers=len(page_configs)) as executor:
            futures = []
            for i, config in enumerate(page_configs):
                futures.append(executor.submit(process_page, i+1, config["url"], config["prompt"], config["debug_port"]))

            # Esperar a que todos los hilos terminen
            for future in futures:
                future.result()

        print("Proceso completado en todas las páginas.")

    finally:
        # Restaurar la configuración de energía al finalizar
        restore_sleep_mode()

if __name__ == "__main__":
    main()
/**
 * Catálogo centralizado de palabras vacías (Stop Words) en español
 * optimizado para consultas universitarias y normativas de la USS.
 * Conforme al protocolo de constantes institucional de AGENTS.md.
 */

export const SPANISH_STOP_WORDS = new Set([
  // Artículos determinados e indeterminados
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'al', 'del',

  // Preposiciones
  'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante', 'en',
  'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'segun', 'según', 'sin',
  'so', 'sobre', 'tras', 'versus', 'via', 'vía',

  // Conjunciones
  'y', 'e', 'ni', 'o', 'u', 'pero', 'mas', 'más', 'sino', 'aunque', 'porque',
  'pues', 'ya', 'si', 'siquiera',

  // Pronombres y posesivos
  'yo', 'tu', 'tú', 'el', 'él', 'ella', 'ello', 'nosotros', 'nosotras', 'vosotros',
  'vosotras', 'ellos', 'ellas', 'me', 'te', 'se', 'nos', 'os', 'le', 'les',
  'mi', 'mí', 'mis', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras',

  // Demostrativos
  'este', 'esta', 'estos', 'estas', 'esto', 'ese', 'esa', 'esos', 'esas', 'eso',
  'aquel', 'aquella', 'aquellos', 'aquellas', 'aquello',

  // Indefinidos y cuantitativos
  'todo', 'toda', 'todos', 'todas', 'otro', 'otra', 'otros', 'otras', 'mismo',
  'misma', 'mismos', 'mismas', 'algun', 'algún', 'alguno', 'alguna', 'algunos',
  'algunas', 'ningun', 'ningún', 'ninguno', 'ninguna', 'poco', 'poca', 'pocos',
  'pocas', 'mucho', 'mucha', 'muchos', 'muchas', 'tanto', 'tanta', 'tantos',
  'tantas', 'demasiado', 'demasiada', 'bastante', 'cada', 'ambos', 'ambas',
  'algo', 'nada',

  // Interrogativos, exclamativos y relativos (con y sin tilde)
  'que', 'qué', 'quien', 'quién', 'quienes', 'quiénes', 'cual', 'cuál',
  'cuales', 'cuáles', 'donde', 'dónde', 'cuando', 'cuándo', 'como', 'cómo',
  'cuanto', 'cuánto', 'cuanta', 'cuánta', 'cuantos', 'cuántos', 'cuantas', 'cuántas',

  // Verbos auxiliares, copulativos y conversacionales comunes
  'es', 'son', 'era', 'eran', 'fue', 'fueron', 'ser', 'sido', 'siendo',
  'hay', 'habia', 'había', 'hubo', 'haber', 'habido',
  'estar', 'esta', 'está', 'estan', 'están', 'estado',
  'hacer', 'hago', 'hace', 'hacen', 'hice', 'hecho',
  'poder', 'puedo', 'puede', 'pueden', 'podria', 'podría',
  'deber', 'debo', 'debe', 'deben', 'deberia', 'debería',
  'tener', 'tengo', 'tiene', 'tienen', 'tuve', 'tenido',
  'saber', 'se', 'sé', 'sabe', 'saben', 'supo', 'sabido',
  'querer', 'quiero', 'quiere', 'quieren', 'quisiera',
  'decir', 'dice', 'dicen', 'dijo',
  'ir', 'voy', 'va', 'van', 'fui', 'ido',

  // Adverbios comunes y partículas
  'aqui', 'aquí', 'alli', 'allí', 'ahi', 'ahí', 'alla', 'allá',
  'ahora', 'antes', 'despues', 'después', 'luego', 'siempre', 'nunca', 'jamas', 'jamás',
  'muy', 'tan', 'bien', 'mal', 'asi', 'así', 'tambien', 'también', 'tampoco',
  'solo', 'sólo', 'solamente', 'cierto', 'claro',
])

/**
 * Normaliza y extrae palabras clave sustantivas de un texto, eliminando
 * signos de puntuación, palabras vacías (stop words) y términos con longitud <= 2.
 *
 * @param text - Texto o consulta del usuario
 * @returns Arreglo de palabras clave sustantivas únicas en minúsculas
 */
export function extractCleanKeywords(text: string): string[] {
  if (!text || typeof text !== 'string') return []

  const words = text
    .toLowerCase()
    .replace(/[¿?¡!.,;:()[\]{}"'\\/_\-=+*^~`#@$%&<>|]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !SPANISH_STOP_WORDS.has(w))

  return Array.from(new Set(words))
}

import type { Idioma } from '@/i18n/idioma'

/**
 * En qué idioma tiene que escribir el modelo.
 *
 * **Esta es la mitad del bilingüe que se olvida.** Traducir botones y titulares
 * no traduce el producto: lo que la persona compra es la lectura, y esa la
 * escribe un modelo que hace lo que le diga el prompt. Con «En español» fijo,
 * un comprador inglés pagaría 49 $ por un texto que no puede leer, con la
 * interfaz perfectamente traducida alrededor.
 *
 * El resto de instrucciones —el tono, tutear, no ser místico de catálogo— no
 * cambia con el idioma. Lo único que cambia es esta línea, así que vive aquí y
 * no repetida en tres prompts.
 */
export const INSTRUCCION_IDIOMA: Record<Idioma, string> = {
  es: 'En español, tuteando, en segunda persona.',
  /*
   * El inglés no distingue tú de usted, así que «tuteando» no se traduce: lo
   * que hay que pedir es el registro equivalente, que es el tono directo y sin
   * ceremonia. Sin decirlo, el modelo tiende a un inglés más formal del que
   * tiene la versión española, y las dos dejarían de sonar al mismo producto.
   */
  en: 'In English, second person, warm and direct — never formal or ceremonious.',
}

/**
 * El contenido ya generado **no se traduce**.
 *
 * La lectura base se genera una sola vez y se guarda. Si alguien cambia de
 * idioma después, lo que ya tiene se queda como está: regenerarla costaría
 * dinero y, sobre todo, le cambiaría su lectura personal bajo los pies. Lo que
 * se genere a partir de ahí sí sale en el idioma nuevo.
 */
export function instruccionDeIdioma(idioma: Idioma): string {
  return INSTRUCCION_IDIOMA[idioma]
}

/**
 * La orden del idioma, dicha donde no se puede pasar por alto.
 *
 * `INSTRUCCION_IDIOMA` es una línea entre otras quince, dentro de un prompt
 * escrito entero en español. Para la lectura base bastaba; para la lectura de
 * hoy no: un comprador inglés recibió su lectura del día en español, con la
 * interfaz en inglés alrededor (3 oct 2026). El idioma guardado era `en` y la
 * instrucción estaba puesta — el modelo simplemente se dejó llevar por el
 * idioma en que está escrito todo lo demás.
 *
 * Así que se repite arriba y abajo, fuera de la lista. Lo primero y lo último
 * que lee el modelo es en qué idioma tiene que escribir, y se le avisa de que
 * las instrucciones van en otro para que no lo tome como ejemplo.
 */
export function ordenDeIdioma(idioma: Idioma): string {
  return idioma === 'en'
    ? 'IDIOMA DE SALIDA: INGLÉS. Estas instrucciones están en español, pero TODO lo que escribas va en inglés: titulares, párrafos y cada campo. Ni una sola frase en español.'
    : 'IDIOMA DE SALIDA: ESPAÑOL. Todo lo que escribas va en español.'
}

/** Envuelve un prompt con la orden del idioma, al principio y al final. */
export function conOrdenDeIdioma(idioma: Idioma, prompt: string): string {
  const orden = ordenDeIdioma(idioma)
  return `${orden}\n\n${prompt}\n\n${orden}`
}

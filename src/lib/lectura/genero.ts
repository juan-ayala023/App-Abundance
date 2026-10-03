/**
 * A quién le habla la lectura.
 *
 * Vive en su propio módulo, y no en `voz.ts`, porque lo necesitan las dos
 * orillas: el servidor para escribir y el formulario de alta para preguntarlo.
 * `voz.ts` lleva dentro el prompt entero —varios miles de caracteres de
 * instrucciones— y no tiene por qué viajar al navegador para pintar tres
 * botones.
 *
 * `sin-decir` no es lo mismo que no haberlo preguntado, aunque la voz los
 * trate igual: uno es una elección y el otro un portal anterior a la pregunta.
 * Se distinguen en la base para no volver a preguntárselo a quien ya dijo que
 * prefería no decirlo.
 */
export const GENEROS = ['femenino', 'masculino', 'sin-decir'] as const

export type Genero = (typeof GENEROS)[number]

export function esGenero(valor: unknown): valor is Genero {
  return typeof valor === 'string' && (GENEROS as readonly string[]).includes(valor)
}

/**
 * Lo que hay en `portals.genero`, convertido en género o en nada.
 *
 * La columna es `text` con un *check*, así que la base ya rechaza un valor
 * raro; esto existe para el tipo y para que un portal creado antes de que se
 * preguntara caiga en la voz neutra sin un condicional en cada generador.
 */
export function generoParaLaVoz(valor: unknown): Genero | null {
  return esGenero(valor) ? valor : null
}

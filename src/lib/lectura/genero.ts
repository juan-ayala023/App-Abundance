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

/**
 * Lo que hay que decirle a quien traduce.
 *
 * Traducir del inglés al español obliga a decidir algo que el inglés no dice:
 * «you are not alone» es «no estás solo» o «no estás sola», y no hay tercera
 * opción natural. Sin este dato el modelo lo echaba a suertes, así que alguien
 * que compró en inglés y luego miraba el portal en español podía encontrarse
 * tratado en el género contrario — lo mismo que la pregunta del alta venía a
 * evitar.
 *
 * Sin género conocido se le pide lo que hacía la voz antes de que se
 * preguntara: buscar la forma que no obliga a elegir. Decírselo es mejor que
 * callar, porque el silencio es justo lo que le hacía inventárselo.
 */
export function concordanciaAlTraducir(genero: Genero | null): string {
  if (genero === 'femenino') return ' La persona es una mujer: donde el idioma obligue a concordar, en femenino.'
  if (genero === 'masculino') return ' La persona es un hombre: donde el idioma obligue a concordar, en masculino.'
  return ' No sabes el género de la persona: si el idioma obliga a concordar, reformula para no tener que elegirlo.'
}

import { getTranslations } from 'next-intl/server'

import type { Metadata } from 'next'

/**
 * El título de la pestaña, en el idioma de quien mira.
 *
 * Las doce pantallas lo tenían escrito a mano en español, así que alguien que
 * compraba en inglés veía «Activación de hoy» en la pestaña con toda la
 * interfaz en inglés debajo. Nadie se queja de un título, pero es la misma
 * mitad olvidada del bilingüe que ya nos mordió en el checkout y en el correo:
 * se traduce lo que se mira y se olvida lo que está alrededor.
 *
 * Es `generateMetadata` y no `metadata` porque leer el idioma es leer una
 * cookie, y eso solo puede hacerse dentro de una función.
 */
export function tituloDePagina(clave: string): () => Promise<Metadata> {
  return async () => {
    const t = await getTranslations('titulos')
    return { title: `${t(clave as never)} · Abundance Code` }
  }
}

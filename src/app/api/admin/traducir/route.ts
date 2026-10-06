import { generateObject } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { autorizaLlamadaDeLanding } from '@/lib/access/secretoEntrante'
import { MODELO_LECTURA, modelo } from '@/lib/ai/modelo'
import { conOrdenDeIdioma } from '@/lib/lectura/idioma-prompt'

/**
 * Traducir textos sueltos para el panel de la landing.
 *
 * Nace para el blog, pero no sabe nada de blogs a propósito: recibe un mapa de
 * campos y devuelve el mismo mapa traducido. La landing tiene su contenido en
 * la base del backend, que esta app no puede leer; y esta app tiene el modelo,
 * que el backend no tiene. Así que el backend manda el texto, aquí se traduce,
 * y el backend lo guarda. La clave del modelo sigue viviendo en un solo sitio.
 *
 * Es el mismo oficio que `traducirLecturaBase()` y comparte su regla principal:
 * **traducir, no reescribir.** Un artículo traducido que dice otra cosa que el
 * original no es una traducción, es un artículo nuevo que nadie revisó.
 *
 *   POST /api/admin/traducir
 *   { "idioma": "en", "textos": { "title": "…", "content": "<p>…</p>" } }
 *   200 { "textos": { "title": "…", "content": "<p>…</p>" } }
 */

const cuerpoSchema = z.object({
  idioma: z.enum(['es', 'en']),
  textos: z.record(z.string(), z.string()),
  /** Para afinar el encargo: «un artículo de blog», «una ficha de producto». */
  que: z.string().max(120).optional(),
})

/* Un artículo entero cabe de sobra; el tope evita que un error mande un libro. */
const MAXIMO_CARACTERES = 60_000

export async function POST(request: Request) {
  const permiso = autorizaLlamadaDeLanding(request)
  if (!permiso.ok) {
    console.error('[api/admin/traducir]', permiso.motivo)
    return NextResponse.json({ message: 'No autorizado' }, { status: permiso.estado })
  }

  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null))
  if (!cuerpo.success) {
    return NextResponse.json({ message: 'Datos no válidos' }, { status: 400 })
  }

  const { idioma, textos, que } = cuerpo.data

  /* Solo lo que tiene algo: un campo vacío traducido vuelve inventado. */
  const conTexto = Object.fromEntries(
    Object.entries(textos).filter(([, valor]) => valor.trim().length > 0),
  )
  const claves = Object.keys(conTexto)
  if (claves.length === 0) {
    return NextResponse.json({ message: 'No hay nada que traducir' }, { status: 400 })
  }

  const largo = Object.values(conTexto).join('').length
  if (largo > MAXIMO_CARACTERES) {
    return NextResponse.json({ message: 'El texto es demasiado largo' }, { status: 413 })
  }

  const esquema = z.object(Object.fromEntries(claves.map((c) => [c, z.string()])))

  const encargo = `Traduces ${que ?? 'un texto'} al ${idioma === 'en' ? 'inglés' : 'español'}, campo por campo.

CÓMO TRADUCES
- Traduces, no reescribes: ni resumes, ni añades, ni quitas, ni mejoras. El texto traducido dice exactamente lo que dice el original.
- Mantienes el tono, la longitud aproximada y la segunda persona si la hay.
- **El HTML se conserva tal cual.** Las etiquetas, los atributos, las clases, los enlaces y las URL no se traducen ni se reordenan: solo el texto que hay entre ellas. Si un párrafo va en <p>, vuelve en <p>.
- Los nombres propios, las marcas y «Abundance Code» se quedan como están.
- Los términos de astrología van en su forma habitual del idioma de destino: Sol/Sun, Luna/Moon, Ascendente/Rising, casas/houses.
- Devuelves **todos** los campos que recibes, con la misma clave.`

  try {
    const { object } = await generateObject({
      model: modelo(MODELO_LECTURA),
      schema: esquema,
      system: conOrdenDeIdioma(idioma, encargo),
      prompt: JSON.stringify(conTexto),
      maxOutputTokens: 16000,
    })

    return NextResponse.json({ textos: object })
  } catch (error) {
    console.error('[api/admin/traducir] falló', error)
    return NextResponse.json({ message: 'No se pudo traducir ahora mismo' }, { status: 503 })
  }
}

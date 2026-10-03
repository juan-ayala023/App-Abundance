import { NextResponse } from 'next/server'
import { z } from 'zod'

import { autorizaLlamadaDeLanding } from '@/lib/access/secretoEntrante'
import { COLUMNAS_PARA_RETIRAR, retirarLecturas } from '@/lib/lectura/retirar'
import { createAdminClient } from '@/lib/supabase/server'
import { BirthInstantError, resolveBirthInstant } from '@/lib/time/birth-instant'

/**
 * Corregir la fecha o la hora de nacimiento, desde el panel de la landing.
 *
 * Faltaba la otra mitad de una promesa que la app ya hacía. «Solicitar una
 * corrección» manda un aviso al buzón de soporte, y ahí se acababa: la persona
 * no puede cambiar su nacimiento una vez tiene carta —a propósito, porque
 * invalida todo lo escrito— y el panel tampoco podía. La única forma de
 * atender una solicitud era editar la base de datos a mano, que es justo lo
 * que no debe hacerse con el dato del que cuelga el producto entero.
 *
 * **Esto no es un retoque.** Un año de diferencia mueve la Luna trece grados
 * por día, así que cambia el signo lunar, el ascendente, las casas y con ellos
 * los tránsitos. La carta queda inservible y lo escrito desde ella también. Por
 * eso aquí se archiva todo —releíble en `reading_versions`, nunca se borra— y
 * se vacía la carta para que se recalcule sola en la siguiente visita.
 *
 * La ciudad es opcional: si no viene, se conserva la que había. La mayoría de
 * las correcciones son de fecha o de hora, y obligar a reelegir la ciudad en
 * cada una sería invitar a cambiarla sin querer. Cuando viene, trae también sus
 * coordenadas y su zona horaria, que es lo que de verdad mueve el ascendente.
 *
 *   POST /api/admin/corregir-nacimiento
 *   { "email": "…", "birthDate": "1990-07-03", "birthTime": "00:30" | null,
 *     "timeUnknown": false }
 *
 *   200 { "archivadas": ["lectura", "retrato"], "antes": {…}, "ahora": {…} }
 *   400 datos no válidos · 404 sin cuenta o sin portal · 409 no cambia nada
 */

const cuerpoSchema = z
  .object({
    email: z.email(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida'),
    birthTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora no válida')
      .nullable(),
    timeUnknown: z.boolean(),
    /*
     * La ciudad, opcional. Si no viene, se conserva la que había: la mayoría
     * de las correcciones son de fecha o de hora, y obligar a reelegir la
     * ciudad en cada una sería invitar a cambiarla sin querer.
     */
    place: z
      .object({
        city: z.string().min(1),
        country: z.string(),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        tz: z.string().min(1),
      })
      .nullish(),
  })
  .refine((d) => !d.timeUnknown || d.birthTime === null, {
    message: 'No puede haber hora si se marcó como desconocida',
  })
  .refine((d) => d.timeUnknown || d.birthTime !== null, {
    message: 'Indica la hora o márcala como desconocida',
  })

export async function POST(request: Request) {
  const permiso = autorizaLlamadaDeLanding(request)
  if (!permiso.ok) {
    console.error('[api/admin/corregir-nacimiento]', permiso.motivo)
    return NextResponse.json({ message: 'No autorizado' }, { status: permiso.estado })
  }

  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null))
  if (!cuerpo.success) {
    return NextResponse.json(
      { message: cuerpo.error.issues[0]?.message ?? 'Datos no válidos' },
      { status: 400 },
    )
  }

  const { email, birthDate, birthTime, timeUnknown, place } = cuerpo.data
  const db = createAdminClient()

  const { data: perfil } = await db
    .from('profiles')
    .select('id')
    .ilike('email', email.trim().toLowerCase())
    .maybeSingle()

  if (!perfil) {
    return NextResponse.json({ message: 'No hay una cuenta con ese correo' }, { status: 404 })
  }

  const { data: portal } = await db
    .from('portals')
    .select(COLUMNAS_PARA_RETIRAR)
    .eq('user_id', perfil.id)
    .maybeSingle()

  if (!portal) {
    return NextResponse.json(
      { message: 'Esa cuenta todavía no ha dado sus datos de nacimiento' },
      { status: 404 },
    )
  }

  /*
   * Si no cambia nada, no se toca nada. Una corrección que repite lo que ya
   * había archivaría una lectura buena y la haría reescribir —con el coste y
   * el texto distinto que eso trae— a cambio de nada.
   */
  const horaActual = portal.birth_time ? String(portal.birth_time).slice(0, 5) : null
  const mismoNacimiento =
    portal.birth_date === birthDate &&
    horaActual === birthTime &&
    Boolean(portal.time_unknown) === timeUnknown &&
    (!place || place.city === portal.birth_city)

  if (mismoNacimiento) {
    return NextResponse.json(
      { message: 'Esos son los datos que ya tiene guardados' },
      { status: 409 },
    )
  }

  /*
   * Que el instante se pueda resolver con SU zona horaria. Es la misma
   * comprobación que hace el alta, y vale aquí por lo mismo: más vale saber
   * que una combinación es imposible antes de archivar la lectura que después.
   */
  const zona = place?.tz ?? portal.tz

  if (!zona) {
    return NextResponse.json(
      { message: 'Ese portal no tiene zona horaria guardada: hay que arreglarlo a mano' },
      { status: 409 },
    )
  }

  try {
    resolveBirthInstant({ birthDate, birthTime, timeUnknown, tz: zona })
  } catch (error) {
    if (error instanceof BirthInstantError) {
      return NextResponse.json(
        { message: 'Esa combinación de fecha, hora y lugar no se puede interpretar' },
        { status: 400 },
      )
    }
    throw error
  }

  const antes = {
    birthDate: portal.birth_date,
    birthTime: horaActual,
    timeUnknown: Boolean(portal.time_unknown),
    lugar: [portal.birth_city, portal.birth_country].filter(Boolean).join(', '),
  }

  /*
   * Primero archivar, luego cambiar.
   *
   * `retirarLecturas` guarda lo escrito en `reading_versions` CON el
   * nacimiento viejo al lado, que es lo que permite entender después por qué
   * aquel texto decía lo que decía. Si el archivado falla no vacía nada, así
   * que cortar aquí deja a la persona con su lectura intacta: la corrección se
   * reintenta, pero no se pierde un texto que ya leyó.
   */
  const retiro = await retirarLecturas(db, portal, 'correccion-nacimiento')

  if (!retiro.ok && retiro.motivo !== 'nada-que-retirar') {
    return NextResponse.json(
      { message: 'No se pudo archivar lo que ya estaba escrito: no se ha cambiado nada' },
      { status: 503 },
    )
  }

  /*
   * La lectura del mes también sale de la carta, así que con otra carta ya no
   * describe nada. Se borran la vigente y las futuras; las pasadas se quedan
   * como el registro de lo que esa persona leyó en su momento.
   */
  const hoy = new Date().toISOString().slice(0, 10)
  const { error: errorMes } = await db
    .from('forecasts')
    .delete()
    .eq('portal_id', portal.id)
    .gte('hasta', hoy)

  if (errorMes) {
    // No corta la corrección: la lectura del mes se reescribe sola al abrirla.
    console.error('[corregir-nacimiento] no se pudo retirar la lectura del mes', errorMes)
  }

  const { error } = await db
    .from('portals')
    .update({
      birth_date: birthDate,
      birth_time: timeUnknown ? null : birthTime,
      time_unknown: timeUnknown,
      ...(place
        ? {
            birth_city: place.city,
            birth_country: place.country,
            lat: place.lat,
            lng: place.lng,
            tz: place.tz,
          }
        : {}),
      // La carta se vacía para que `asegurarCarta()` la recalcule con los datos
      // nuevos en la siguiente visita. No se calcula aquí: tardaría y esta
      // petición tiene que contestar al panel.
      chart: null,
      chart_version: null,
      chart_computed_at: null,
    })
    .eq('id', portal.id)

  if (error) {
    console.error('[corregir-nacimiento] no se pudo guardar', error)
    return NextResponse.json({ message: 'No se pudo guardar la corrección' }, { status: 503 })
  }

  return NextResponse.json({
    archivadas: retiro.ok ? retiro.archivadas : [],
    antes,
    ahora: {
      birthDate,
      birthTime: timeUnknown ? null : birthTime,
      timeUnknown,
      lugar: place
        ? [place.city, place.country].filter(Boolean).join(', ')
        : antes.lugar,
    },
  })
}

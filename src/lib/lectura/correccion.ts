import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

/**
 * Cada cuánto puede alguien corregir su propio nacimiento.
 *
 * Hasta el 3 de octubre de 2026 no podía: la revisión de septiembre pidió que
 * la fecha, la hora y el lugar pasaran por soporte, y la pantalla solo mandaba
 * una solicitud a un buzón. En la práctica eso dejaba a la persona esperando a
 * que alguien leyera un correo para arreglar un dedazo suyo.
 *
 * Ahora lo hace ella, con un freno. No es por desconfianza: corregir reescribe
 * la lectura, y una lectura nueva no es la misma que la que leyó —aunque la
 * anterior quede archivada—. Un día de espera entre cambios es suficiente para
 * que nadie entre en bucle y corto para quien de verdad se equivocó.
 */
export const HORAS_ENTRE_CORRECCIONES = 24

/**
 * Cuándo podrá volver a corregir, o `null` si puede ahora.
 *
 * Se mira en `reading_versions`, que es donde queda la huella de cada
 * corrección con su fecha. No hace falta una columna nueva: el archivo ya
 * existe porque nunca se borra lo que la persona leyó, y de paso significa que
 * quien todavía no tiene ninguna lectura escrita no tiene freno ninguno — no
 * hay nada que proteger.
 */
export async function esperaParaCorregir(
  admin: SupabaseClient<Database>,
  portalId: string,
): Promise<Date | null> {
  const { data, error } = await admin
    .from('reading_versions')
    .select('archived_at')
    .eq('portal_id', portalId)
    .eq('reason', 'correccion-nacimiento')
    .order('archived_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  /* Si no se puede leer el archivo, no se bloquea a nadie: el freno es una
   * comodidad, y dejar a alguien sin corregir por un fallo de lectura sería
   * peor que permitirle una corrección de más. */
  if (error || !data?.archived_at) return null

  const libre = new Date(
    new Date(data.archived_at).getTime() + HORAS_ENTRE_CORRECCIONES * 3600 * 1000,
  )
  return libre > new Date() ? libre : null
}

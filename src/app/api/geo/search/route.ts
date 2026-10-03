import { NextResponse, type NextRequest } from 'next/server'

import { idiomaActual } from '@/i18n/idioma'

import { createGeoNamesProvider } from '@/lib/geo/geonames'
import { GeocodingError } from '@/lib/geo/types'
import { createClient } from '@/lib/supabase/server'

/**
 * Búsqueda de ciudades para el formulario de nacimiento.
 *
 * Va por el servidor a propósito: el usuario de GeoNames es una credencial y
 * no puede viajar al navegador. Exige sesión para que no sea un proxy abierto
 * con el que cualquiera pueda consumir nuestra cuota.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (query.length < 2) {
    return NextResponse.json({ places: [] })
  }

  try {
    /*
     * Los nombres de país salen en el idioma de quien busca.
     *
     * GeoNames los traduce si se le pide; sin pedirlo devolvía siempre
     * español, así que una persona que hacía el alta en inglés guardaba
     * «Miami, EE. UU.» y lo veía así para siempre en Mi Cuenta, rodeado de
     * interfaz inglesa. Lo vio Juanjo probando el 3 de octubre de 2026.
     *
     * Solo cambia lo que se lee: la carta se calcula con latitud, longitud y
     * zona horaria, que no dependen del idioma.
     */
    const places = await createGeoNamesProvider().search(query, { lang: await idiomaActual() })
    return NextResponse.json({ places })
  } catch (error) {
    if (error instanceof GeocodingError) {
      console.error('[api/geo/search]', error.message)
      return NextResponse.json(
        { error: 'No pudimos buscar ciudades ahora mismo. Inténtalo de nuevo.' },
        { status: 503 },
      )
    }

    console.error('[api/geo/search] error inesperado', error)
    return NextResponse.json({ error: 'Error inesperado.' }, { status: 500 })
  }
}

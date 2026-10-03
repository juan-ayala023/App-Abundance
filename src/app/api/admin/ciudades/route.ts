import { NextResponse, type NextRequest } from 'next/server'

import { autorizaLlamadaDeLanding } from '@/lib/access/secretoEntrante'
import { createGeoNamesProvider } from '@/lib/geo/geonames'
import { GeocodingError } from '@/lib/geo/types'

/**
 * Buscar ciudades desde el panel de administración.
 *
 * Es el mismo buscador que usa el formulario de alta, pero con la otra
 * autenticación: aquel exige sesión de usuario y el panel vive en la landing,
 * que no la tiene. Sin esto, el panel podía corregir la fecha y la hora pero
 * no la ciudad, porque una ciudad no es un texto — son coordenadas y una zona
 * horaria, y de ellas salen el ascendente y las casas.
 *
 * Las credenciales de GeoNames se quedan aquí, como en el otro: nunca viajan
 * al navegador de nadie.
 *
 *   GET /api/admin/ciudades?q=bogo   →  { places: [...] }
 */
export async function GET(request: NextRequest) {
  const permiso = autorizaLlamadaDeLanding(request)
  if (!permiso.ok) {
    console.error('[api/admin/ciudades]', permiso.motivo)
    return NextResponse.json({ message: 'No autorizado' }, { status: permiso.estado })
  }

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (query.length < 2) {
    return NextResponse.json({ places: [] })
  }

  try {
    /*
     * En español siempre, a diferencia del buscador de la app: aquí quien lee
     * es el administrador, no la persona que nació allí. Lo que se guarde se
     * verá luego en el idioma en que esa persona tenga su portal, así que el
     * nombre del país es solo una etiqueta para elegir bien.
     */
    const places = await createGeoNamesProvider().search(query, { lang: 'es' })
    return NextResponse.json({ places })
  } catch (error) {
    if (error instanceof GeocodingError) {
      console.error('[api/admin/ciudades]', error.message)
      return NextResponse.json({ message: 'No se pudo buscar ciudades' }, { status: 503 })
    }
    throw error
  }
}

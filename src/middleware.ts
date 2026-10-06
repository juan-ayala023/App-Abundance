import { NextResponse, type NextRequest } from 'next/server'

import { COOKIE_IDIOMA, esIdioma } from '@/i18n/idioma'
import { esRutaProtegida } from '@/lib/access/rutas'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Refresca la sesión en cada petición y cierra el paso a las rutas del
 * grupo (app) a quien no tiene sesión.
 *
 * Aquí solo se comprueba la SESIÓN, no el entitlement: consultar la base de
 * datos en el edge por cada petición saldría caro. La comprobación de compra
 * activa vive en el layout de (app), que se ejecuta una vez por navegación.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname, search } = request.nextUrl

  /*
   * El idioma puede venir en la URL: `?lang=en`.
   *
   * La app guarda el idioma en una cookie de SU dominio, y quien compra llega
   * desde otro —la web, o un enlace del correo—, así que llega sin ninguna y
   * veía el portal en español aunque hubiera comprado en inglés. Andrea lo
   * probó el 3 de octubre de 2026: la web en inglés, el correo en inglés, y el
   * portal en español.
   *
   * Se hace aquí y no en cada página porque las puertas de entrada son varias
   * —`/activar`, `/auth/callback`, `/auth/confirm`— y todas pasan por aquí.
   * Solo se escribe si el valor es uno de los idiomas: el nombre de la cookie
   * decide qué archivo de mensajes se importa.
   */
  const pedido = request.nextUrl.searchParams.get('lang')
  if (esIdioma(pedido) && request.cookies.get(COOKIE_IDIOMA)?.value !== pedido) {
    response.cookies.set(COOKIE_IDIOMA, pedido, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  if (!user && esRutaProtegida(pathname)) {
    const destino = request.nextUrl.clone()
    destino.pathname = '/activar'
    destino.search = ''
    // Para devolverlo a donde quería ir una vez identificado.
    destino.searchParams.set('next', `${pathname}${search}`)

    return NextResponse.redirect(destino)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto estáticos e imágenes.
     * `/api/health` también queda fuera: lo consulta un despliegue, no una
     * persona, y pasarlo por el refresco de sesión sería trabajo para nada.
     *
     * El webhook de Stripe y /api/admin se excluyen a propósito: son llamadas
     * de servidor a servidor, sin sesión de usuario, y no deben pasar por el
     * refresco de cookies.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|api/admin|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
}

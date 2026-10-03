/**
 * A dónde va alguien que acaba de entrar y todavía no tiene compra registrada.
 *
 * Parece que la respuesta obvia es «a la pantalla que explica que no
 * encontramos su compra», y durante un tiempo lo fue. Es falsa para el caso
 * más importante del producto: **el comprador que entra por primera vez**.
 *
 * Su compra no está en nuestra base todavía. La fila se crea al canjear el
 * token que viaja en el enlace del correo, y ese canje ocurre en `/activar`,
 * después de identificarse. Así que al volver de Google —o del enlace por
 * correo— la respuesta a «¿tiene compra?» es que no, legítimamente, porque el
 * canje aún no ha pasado. Mandarlo entonces a «no encontramos tu compra» tira
 * el token por el camino: la pantalla a la que llega no lo lleva, el token
 * nunca se canjea y la persona que acaba de pagar ve que no hay nada suyo.
 *
 * Le pasó a Andrea el 3 de octubre de 2026 en una compra real: pagó, le llegó
 * el correo, pulsó «Entrar a mi portal», entró con Google y aterrizó en «No
 * encontramos tu compra». Su token seguía sin canjear en la base.
 *
 * La regla, entonces: si el destino era `/activar`, se respeta. Esa pantalla
 * sabe canjear, y si el canje falla es ella quien manda a la de vincular, ya
 * con un motivo que contar.
 */
export function destinoSinCompra(next: string): string {
  return esDelCanje(next) ? next : '/activar/vincular'
}

/** Lo mismo para quien tiene una compra que ya no da acceso y trae un token nuevo. */
export function destinoInactivo(next: string): string {
  return esDelCanje(next) ? next : '/activar/vincular?estado=inactivo'
}

/**
 * Si esta ruta es la del canje.
 *
 * Se compara contra la ruta sola, sin los parámetros: `/activar?token=…` vale,
 * y `/activarse-gratis` no, que con un `startsWith` a secas habría pasado.
 */
function esDelCanje(next: string): boolean {
  const ruta = next.split(/[?#]/)[0]
  return ruta === '/activar'
}

import { describe, expect, it } from 'vitest'

import { destinoInactivo, destinoSinCompra } from './destino-login'

/**
 * El caso que costó una compra real.
 *
 * Andrea pagó el 3 de octubre de 2026, le llegó el correo, pulsó «Entrar a mi
 * portal» y entró con Google. Aterrizó en «No encontramos tu compra» con su
 * token sin canjear: el retorno de Google veía que todavía no había fila de
 * compra —no la hay hasta canjear— y la mandaba a esa pantalla, tirando por el
 * camino el `next` que llevaba el token.
 */
describe('destinoSinCompra', () => {
  it('respeta el destino cuando queda un token por canjear', () => {
    const next = '/activar?token=abc123&reciente=1'
    expect(destinoSinCompra(next)).toBe(next)
  })

  it('también con un next encadenado', () => {
    const next = '/activar?token=abc123&reciente=1&next=%2Fportal'
    expect(destinoSinCompra(next)).toBe(next)
  })

  it('sin token que canjear, a la pantalla que lo explica', () => {
    expect(destinoSinCompra('/portal')).toBe('/activar/vincular')
    expect(destinoSinCompra('/cuenta')).toBe('/activar/vincular')
  })

  /**
   * Una ruta que solo empieza igual no es la del canje.
   *
   * Con `startsWith('/activar')` a secas, `/activarse-gratis` habría pasado
   * por buena. No existe hoy, y por eso mismo conviene que la regla no dependa
   * de que nadie la cree mañana.
   */
  it('no confunde una ruta que solo empieza igual', () => {
    expect(destinoSinCompra('/activarse-gratis')).toBe('/activar/vincular')
    expect(destinoSinCompra('/activar-ya')).toBe('/activar/vincular')
  })

  it('la ruta de vincular no se redirige a sí misma en bucle', () => {
    expect(destinoSinCompra('/activar/vincular')).toBe('/activar/vincular')
  })
})

describe('destinoInactivo', () => {
  it('deja canjear un token nuevo a quien tenía una compra vencida', () => {
    const next = '/activar?token=abc123&reciente=1'
    expect(destinoInactivo(next)).toBe(next)
  })

  it('y si no lo trae, explica que su acceso está inactivo', () => {
    expect(destinoInactivo('/portal')).toBe('/activar/vincular?estado=inactivo')
  })
})

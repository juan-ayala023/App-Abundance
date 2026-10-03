import { describe, expect, it } from 'vitest'

import { conOrdenDeIdioma, ordenDeIdioma } from './idioma-prompt'

describe('ordenDeIdioma', () => {
  it('avisa de que las instrucciones van en otro idioma', () => {
    expect(ordenDeIdioma('en')).toMatch(/INGLÉS/)
    expect(ordenDeIdioma('en')).toMatch(/instrucciones están en español/)
    expect(ordenDeIdioma('es')).toMatch(/ESPAÑOL/)
  })

  it('la orden abre y cierra el prompt', () => {
    /*
     * Las dos veces importan: una línea de idioma perdida entre quince
     * instrucciones escritas en español no bastó —la lectura de hoy salió en
     * español para un comprador inglés—, así que es lo primero y lo último
     * que lee el modelo.
     */
    const envuelto = conOrdenDeIdioma('en', 'CUERPO DEL PROMPT')
    const orden = ordenDeIdioma('en')
    expect(envuelto.startsWith(orden)).toBe(true)
    expect(envuelto.endsWith(orden)).toBe(true)
    expect(envuelto).toContain('CUERPO DEL PROMPT')
  })
})

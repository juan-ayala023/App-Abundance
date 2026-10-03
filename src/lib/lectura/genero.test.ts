import { describe, expect, it } from 'vitest'

import { esGenero, GENEROS, generoParaLaVoz } from './genero'

describe('generoParaLaVoz', () => {
  it('deja pasar los tres valores que acepta la base', () => {
    for (const valor of GENEROS) expect(generoParaLaVoz(valor)).toBe(valor)
  })

  it('convierte en nada lo que no es un género', () => {
    // Un portal creado antes de que se preguntara trae `null`; cualquier otra
    // cosa solo puede venir de un formulario manipulado o de datos viejos.
    for (const valor of [null, undefined, '', 'otro', 'female', 1, {}]) {
      expect(generoParaLaVoz(valor)).toBeNull()
    }
  })

  it('esGenero distingue la elección de no decirlo', () => {
    // `sin-decir` ES una respuesta: la voz la trata como neutra, pero la base
    // la guarda para no volver a preguntar.
    expect(esGenero('sin-decir')).toBe(true)
    expect(esGenero(null)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import type { z } from 'zod'

import {
  activacionDiariaSchema,
  activacionGeneradaSchema,
  lecturaGeneradaSchema,
  mesGeneradoSchema,
  retratoExactoSchema,
  retratoParcialSchema,
} from './schemas'

/**
 * Ningún esquema de generación puede llevar campos opcionales.
 *
 * El modo estricto de OpenAI exige que **todas** las propiedades estén en
 * `required` y rechaza la llamada entera si falta una:
 *
 *   «'required' is required to be supplied and to be an array including every
 *    key in properties. Missing 'idioma'.»
 *
 * No es teoría. La activación de cada día se generaba con el mismo esquema que
 * valida lo guardado, que sí tiene `idioma` opcional, y **falló en producción
 * todos los días** hasta el 2 de octubre de 2026. En pantalla solo se veía «tu
 * lectura todavía no está lista»: el motivo estaba en el log del servidor, que
 * nadie mira a diario.
 *
 * No lo cazó ninguna prueba porque las de punta a punta corren sin clave de IA
 * a propósito —generar de verdad costaría dinero en cada ejecución— así que el
 * esquema nunca llegaba a viajar a OpenAI. Esta prueba mira el esquema, que es
 * lo que sí se puede comprobar gratis.
 */
function clavesOpcionales(esquema: z.ZodObject<z.ZodRawShape>): string[] {
  return Object.entries(esquema.shape)
    /* Un campo es opcional si acepta `undefined`: es la prueba más directa. */
    .filter(([, campo]) => (campo as z.ZodType).safeParse(undefined).success)
    .map(([clave]) => clave)
}

describe('esquemas de generación', () => {
  it.each([
    ['activacionGeneradaSchema', activacionGeneradaSchema],
    ['lecturaGeneradaSchema', lecturaGeneradaSchema],
    ['mesGeneradoSchema', mesGeneradoSchema],
    ['retratoExactoSchema', retratoExactoSchema],
    ['retratoParcialSchema', retratoParcialSchema],
  ])('%s no tiene ningún campo opcional', (_nombre, esquema) => {
    expect(clavesOpcionales(esquema as z.ZodObject<z.ZodRawShape>)).toEqual([])
  })

  /**
   * Y el de lectura sí lo tiene, que es justo por lo que hacen falta dos.
   *
   * Lo guardado antes de un cambio no tiene por qué llevar los campos nuevos:
   * exigirlos al leer dejaría contenido que alguien ya pagó sin poder abrirse.
   */
  it('el esquema de lectura admite contenido anterior, y por eso no vale para generar', () => {
    expect(clavesOpcionales(activacionDiariaSchema).sort()).toEqual(['idioma', 'queSeMueve'])
  })

  it('una activación recién generada vale como activación guardada', () => {
    const generada = {
      titular: 'Hoy una respuesta incompleta puede decirte más que una promesa.',
      situacion: 'Puede aparecer una conversación que deje un detalle sin cerrar.',
      queSeMueve: 'Mercurio pasa hoy por tu casa 3, la de lo que se dice y se acuerda.',
      senal: 'Palabras entusiastas sin fecha ni compromiso concreto.',
      evita: 'Ofrecer más para conseguir claridad.',
      activa: 'Haz una pregunta directa y espera la respuesta.',
    }

    expect(activacionGeneradaSchema.safeParse(generada).success).toBe(true)
    expect(activacionDiariaSchema.safeParse({ ...generada, idioma: 'es' }).success).toBe(true)
  })
})

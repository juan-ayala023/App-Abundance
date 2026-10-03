import { describe, expect, it } from 'vitest'

import { esperaParaCorregir, HORAS_ENTRE_CORRECCIONES } from './correccion'

/**
 * Un cliente de Supabase de mentira, con solo lo que usa `esperaParaCorregir`.
 *
 * El freno es la única cosa de este flujo que no se puede probar de punta a
 * punta: cuelga de que haya una lectura escrita que archivar, y las pruebas de
 * navegador corren sin clave de IA a propósito, así que ahí nunca hay ninguna.
 */
function clienteFalso(resultado: { data?: { archived_at: string } | null; error?: unknown }) {
  const cadena = {
    select: () => cadena,
    eq: () => cadena,
    order: () => cadena,
    limit: () => cadena,
    maybeSingle: async () => ({ data: resultado.data ?? null, error: resultado.error ?? null }),
  }
  return { from: () => cadena } as never
}

const haceHoras = (n: number) => new Date(Date.now() - n * 3600 * 1000).toISOString()

describe('esperaParaCorregir', () => {
  it('deja corregir a quien nunca ha corregido', async () => {
    expect(await esperaParaCorregir(clienteFalso({ data: null }), 'p1')).toBeNull()
  })

  it('deja corregir cuando ya pasó el día', async () => {
    const hace = haceHoras(HORAS_ENTRE_CORRECCIONES + 1)
    expect(await esperaParaCorregir(clienteFalso({ data: { archived_at: hace } }), 'p1')).toBeNull()
  })

  it('hace esperar a quien acaba de corregir, y dice hasta cuándo', async () => {
    const hace = haceHoras(1)
    const hasta = await esperaParaCorregir(clienteFalso({ data: { archived_at: hace } }), 'p1')
    expect(hasta).toBeInstanceOf(Date)
    // Corrigió hace una hora: le quedan las otras veintitrés.
    const horasQueFaltan = (hasta!.getTime() - Date.now()) / 3600_000
    expect(horasQueFaltan).toBeGreaterThan(HORAS_ENTRE_CORRECCIONES - 1.5)
    expect(horasQueFaltan).toBeLessThan(HORAS_ENTRE_CORRECCIONES)
  })

  it('si no se puede leer el archivo, no bloquea a nadie', async () => {
    /*
     * El freno es una comodidad. Dejar a alguien sin poder corregir su fecha
     * por un fallo de lectura sería peor que permitirle una corrección de más.
     */
    expect(await esperaParaCorregir(clienteFalso({ error: new Error('caída') }), 'p1')).toBeNull()
  })
})

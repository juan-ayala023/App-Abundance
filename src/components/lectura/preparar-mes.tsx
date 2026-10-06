'use client'

import { useEffect } from 'react'

import { escribirMes } from '@/app/(app)/activacion/actions'

/**
 * Empieza a escribir la lectura del mes mientras la persona lee la de hoy.
 *
 * No pinta nada. Vive en la vista «hoy» y solo cuando el mes aún no existe: la
 * lectura mensual tarda unos cuarenta segundos, y ese es justo el rato que
 * alguien pasa leyendo lo del día. Al cambiar de pestaña, lo normal es que ya
 * esté — que era lo que pedía el cliente: abrir y leer, no abrir y esperar.
 *
 * Lanzarla dos veces no cuesta dos lecturas: `asegurarMes()` engancha la
 * segunda llamada a la primera. Por eso esto puede convivir con el disparo de
 * la propia pestaña del mes sin que nadie lleve la cuenta.
 *
 * Y si la persona se va antes de que termine, da igual: el trabajo es del
 * servidor y acaba guardándose. Lo peor que pasa es que nadie lo vea hoy.
 */
export function PrepararMes() {
  useEffect(() => {
    /* Sin `catch` que haga nada: esto es trabajo adelantado. Si falla, la
     * pestaña del mes lo intentará otra vez y allí sí hay a quién decírselo. */
    escribirMes().catch(() => {})
  }, [])

  return null
}

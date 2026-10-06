'use client'

import { RotateCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { escribirMes } from '@/app/(app)/activacion/actions'

type Estado = 'escribiendo' | 'error' | 'suscripcion' | 'sin-carta'

/**
 * La lectura del mes, escribiéndose sola.
 *
 * Hasta octubre de 2026 esto era un botón: «Hacer mi lectura mensual». La razón
 * era buena —son unos cuarenta segundos de modelo, y lanzarlos a quien solo
 * pasaba por la pantalla es escribir un mes entero que nadie pidió—, pero la
 * consecuencia no: el cliente abría su lectura y encontraba trabajo pendiente
 * en vez de algo que leer. «Abrir debería ser leer», y tiene razón.
 *
 * Ahora empieza al montar. Tres cosas hacen que eso sea sostenible:
 *
 *  1. **Se escribe una vez.** Queda guardada en `forecasts` y las siguientes
 *     visitas la recuperan al instante; esto solo corre el primer día del
 *     periodo.
 *  2. **Solo para quien entra.** No se pregenera para toda la base: se escribe
 *     cuando alguien abre su horóscopo, que es justo quien la va a leer.
 *  3. **Se puede ir.** El trabajo ocurre en el servidor y termina aunque se
 *     cierre la pestaña, así que el aviso lo dice en vez de pedir que espere.
 *
 * El botón se queda para una sola cosa: reintentar cuando algo falló.
 */
export function MesGeneracion({ tieneCarta }: { tieneCarta: boolean }) {
  const t = useTranslations('mes')
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>(tieneCarta ? 'escribiendo' : 'sin-carta')
  /* Cambiar este número vuelve a disparar el efecto: es lo que hace el botón
   * de reintentar. Con un booleano no bastaría — React solo reacciona a
   * dependencias que cambian de valor. */
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!tieneCarta) return

    let vivo = true

    escribirMes()
      .then(({ listo, motivo }) => {
        if (!vivo) return
        if (listo) {
          router.refresh()
          return
        }
        setEstado(
          motivo === 'suscripcion' ? 'suscripcion' : motivo === 'sin-carta' ? 'sin-carta' : 'error',
        )
      })
      .catch(() => {
        if (vivo) setEstado('error')
      })

    return () => {
      vivo = false
    }
  }, [tieneCarta, intento, router])

  if (estado === 'sin-carta') {
    return (
      <p className="rounded-2xl border border-borde bg-superficie px-5 py-4 text-sm">
        {t('sinCarta')}
      </p>
    )
  }

  if (estado === 'suscripcion') {
    return (
      <p className="rounded-2xl border border-borde bg-superficie px-5 py-4 text-sm">
        {t('requiereSuscripcion')}
      </p>
    )
  }

  if (estado === 'error') {
    return (
      <section className="flex flex-col items-start gap-4 rounded-2xl border border-borde bg-superficie px-5 py-6">
        <p role="alert" className="text-sm text-[#a8503c]">
          {t('noDisponible')}
        </p>
        <button
          type="button"
          onClick={() => {
            /* El estado se pone aquí y no dentro del efecto: hacerlo allí sería
               un `setState` síncrono en cada montaje, con el repintado de más
               que eso arrastra. */
            setEstado('escribiendo')
            setIntento((n) => n + 1)
          }}
          className="inline-flex items-center gap-2 rounded-full bg-oro px-7 py-3 font-medium text-white transition-colors hover:bg-oro-hondo"
        >
          <RotateCw size={17} aria-hidden="true" />
          {t('reintentar')}
        </button>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-5" aria-busy="true">
      <div className="flex flex-col gap-1">
        <p role="status" aria-live="polite" className="text-sm text-tinta-suave">
          {t('escribiendo')}
        </p>
        {/* Que se puede ir. El trabajo es del servidor, no de esta pestaña. */}
        <p className="text-sm text-tinta-tenue">{t('puedesIrte')}</p>
      </div>

      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-oro-palido/60" />
        ))}
      </div>
    </section>
  )
}

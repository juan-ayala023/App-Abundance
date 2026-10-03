'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { hayLecturaBase } from '@/app/(app)/generando/actions'

/**
 * El aviso de «tu lectura no llegó a escribirse», pero comprobado.
 *
 * El portal lo decidía con lo que traía su render, y ese render puede ser
 * viejo: mientras la lectura se escribe —un minuto largo— el enlace «Mi
 * Portal» del menú ya se ha precargado, y si la persona lo pulsa al salir de
 * la pantalla de generación recibe esa copia, hecha cuando todavía no había
 * nada. La lectura estaba escrita y guardada; lo único viejo era el HTML.
 *
 * Decirle «tu lectura nunca se escribió» a alguien que acaba de pagar es de
 * las peores frases que puede leer, y además era mentira. Así que antes de
 * enseñarla se pregunta al servidor: si la lectura está, se refresca la
 * pantalla entera —porque entonces TODO el render era viejo, no solo esto— y
 * si de verdad falta, se enseña el aviso como siempre.
 *
 * La comprobación solo la pagan quienes verían el aviso, que son los pocos a
 * los que algo les falló o les va a aparecer bien de todos modos.
 */
export function AvisoFaltaLectura({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [comprobando, setComprobando] = useState(true)

  useEffect(() => {
    let vivo = true

    hayLecturaBase()
      .then((hay) => {
        if (!vivo) return
        if (hay) router.refresh()
        else setComprobando(false)
      })
      /* Si la comprobación falla, se enseña el aviso: es lo que decía el
       * render, y dejar la pantalla en blanco sería peor que un aviso de más. */
      .catch(() => {
        if (vivo) setComprobando(false)
      })

    return () => {
      vivo = false
    }
  }, [router])

  if (comprobando) return null

  return <>{children}</>
}

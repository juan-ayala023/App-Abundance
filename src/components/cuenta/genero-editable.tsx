'use client'

import { PencilLine } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { guardarGenero } from '@/app/(app)/cuenta/actions'
import { ESTADO_GENERO_INICIAL } from '@/app/(app)/cuenta/estado'
import { GENEROS, type Genero } from '@/lib/lectura/genero'

/**
 * Cómo le hablan las lecturas, cambiable desde aquí mismo.
 *
 * Va junto al nombre y no en la corrección de datos de nacimiento: ninguno de
 * los dos entra en el cálculo de la carta, así que cambiarlos no invalida nada
 * y no tiene por qué pasar por soporte. Lo que ya está escrito se queda como
 * estaba —reescribir una lectura que la persona leyó ayer sería peor—, y eso
 * es justo lo que dice el aviso al guardar.
 *
 * Los tres botones son `submit` con su propio `value`: el que se pulsa es el
 * que viaja en el formulario. Un grupo de radios habría necesitado además un
 * botón de guardar, y aquí elegir ya es la decisión entera.
 */
export function GeneroEditable({ genero }: { genero: Genero | null }) {
  const t = useTranslations('cuenta')
  const [estado, guardar] = useActionState(guardarGenero, ESTADO_GENERO_INICIAL)
  const [editando, setEditando] = useState(false)

  /* Al confirmarse el guardado, se vuelve a la vista de lectura. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cierra la edición cuando el servidor confirma
    if (estado.genero) setEditando(false)
  }, [estado.genero])

  const actual = estado.genero ?? genero

  if (!editando) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-tinta-tenue">
              {t('genero')}
            </p>
            <p className="wrap-anywhere text-lg font-light">
              {actual ? t(`generos.${actual}` as never) : t('sinGenero')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditando(true)}
            aria-label={t('cambiarGenero')}
            className="shrink-0 rounded-full border border-borde p-2 text-tinta-suave transition-colors hover:bg-fondo-hondo"
          >
            <PencilLine size={15} aria-hidden="true" />
          </button>
        </div>

        {estado.genero ? (
          <p role="status" className="text-xs text-tinta-tenue">
            {t('generoGuardado')}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form action={guardar} className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-tinta-tenue">{t('genero')}</p>
      <div className="flex flex-col gap-2">
        {GENEROS.map((opcion) => (
          <Opcion key={opcion} opcion={opcion} actual={actual} />
        ))}
      </div>

      {estado.error ? (
        <p role="alert" className="text-xs text-[#a8503c]">
          {estado.error}
        </p>
      ) : null}
    </form>
  )
}

function Opcion({ opcion, actual }: { opcion: Genero; actual: Genero | null }) {
  const t = useTranslations('cuenta')
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      name="genero"
      value={opcion}
      disabled={pending}
      aria-current={opcion === actual}
      className={`rounded-xl border px-4 py-2 text-left text-sm transition-colors disabled:opacity-60 ${
        opcion === actual ? 'border-oro bg-oro-palido/60' : 'border-borde hover:bg-fondo-hondo'
      }`}
    >
      {t(`generos.${opcion}` as never)}
    </button>
  )
}

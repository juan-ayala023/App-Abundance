'use client'

import { Languages } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

/* No se importa de '@/i18n/idioma': es server-only (lee cookies). */
type Idioma = 'es' | 'en'

/**
 * «Esta lectura se escribió en español. Ver en inglés.»
 *
 * Se muestra cuando el contenido está en un idioma distinto al de la
 * interfaz y no hay traducción guardada. El botón llama a la acción que
 * traduce y guarda; al terminar se recarga la página y aparece la versión.
 */
export function AvisoIdioma({
  escritoEn,
  actual,
  traducir,
}: {
  escritoEn: Idioma
  actual: Idioma
  traducir: () => Promise<{ listo: boolean }>
}) {
  const t = useTranslations('lectura')
  const router = useRouter()
  const [estado, setEstado] = useState<'inicial' | 'traduciendo' | 'error'>('inicial')

  /*
   * El nombre del idioma, traducido.
   *
   * Antes salía cada uno escrito en su propia lengua —«Esta lectura se
   * escribió en English»—, que es lo correcto en el selector, donde quien no
   * entiende español tiene que reconocer su idioma, y lo incorrecto dentro de
   * una frase. Aquí la frase manda.
   */
  const nombres = {
    idioma: t(`idiomas.${escritoEn}` as never),
    destino: t(`idiomas.${actual}` as never),
  }

  const pedir = async () => {
    setEstado('traduciendo')
    try {
      const { listo } = await traducir()
      if (!listo) throw new Error('sin traducción')
      router.refresh()
    } catch {
      setEstado('error')
    }
  }

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-2xl border border-oro-claro bg-oro-palido/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2 text-sm">
        <Languages size={18} className="mt-0.5 shrink-0 text-oro-hondo" aria-hidden="true" />
        <span>{t('escritaEn', nombres)}</span>
      </p>
      <button
        type="button"
        onClick={pedir}
        disabled={estado === 'traduciendo'}
        className="shrink-0 rounded-full bg-oro px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oro-hondo disabled:cursor-wait disabled:opacity-60"
      >
        {estado === 'traduciendo' ? t('traduciendo', nombres) : t('traducir', nombres)}
      </button>
      {estado === 'error' ? (
        <p role="alert" className="text-sm text-[#a8503c]">
          {t('traducirError')}
        </p>
      ) : null}
    </div>
  )
}

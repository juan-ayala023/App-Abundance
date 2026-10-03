import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { FormularioNacimiento } from '@/components/onboarding/formulario-nacimiento'
import type { Place } from '@/lib/geo/types'
import { generoParaLaVoz } from '@/lib/lectura/genero'
import { esperaParaCorregir } from '@/lib/lectura/correccion'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { tituloDePagina } from '@/i18n/titulo'

export const generateMetadata = tituloDePagina('onboarding')

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // El layout de (app) ya garantizó sesión y acceso.
  if (!user) redirect('/activar')

  const { data: portal } = await supabase
    .from('portals')
    .select(
      'id, full_name, genero, birth_date, birth_time, time_unknown, birth_city, birth_country, lat, lng, tz, chart',
    )
    .maybeSingle()

  /*
   * Dos modos en una pantalla.
   *
   * Sin `?editar`, es el onboarding de siempre: quien ya completó sus datos no
   * tiene que volver a pasar por aquí y se le manda al portal. Con `?editar`,
   * es la corrección de datos que Mi Cuenta promete: el mismo formulario, con
   * lo que hay guardado ya escrito, y un aviso de lo que pasa con las lecturas
   * al cambiar el nacimiento. Antes este segundo modo no existía y el enlace
   * «revisar mis datos» de la carta acababa aquí y rebotaba al portal.
   */
  const params = await searchParams
  const editando = Boolean(portal?.birth_date) && params.editar !== undefined

  /*
   * Corregir aquí, uno mismo.
   *
   * Hasta el 3 de octubre de 2026 esta pantalla rebotaba a `/cuenta/correccion`
   * en cuanto había carta: el documento de septiembre pidió que la fecha, la
   * hora y el lugar pasaran por soporte. Sonaba prudente y era un callejón —
   * la persona veía mal su propia fecha y tenía que esperar a que alguien
   * leyera un correo para arreglar un dedazo suyo.
   *
   * Ahora lo hace ella. Lo que protegía aquella regla sigue protegido por otro
   * lado: la lectura anterior se archiva y se puede releer, el aviso de abajo
   * dice en claro lo que se va a reescribir, y no se puede cambiar dos veces
   * el mismo día. Pasado ese límite se vuelve a la solicitud por soporte, que
   * sigue existiendo.
   */
  const espera = portal?.chart ? await esperaParaCorregir(createAdminClient(), portal.id) : null
  if (editando && espera) redirect('/cuenta/correccion?espera=1')

  if (portal?.birth_date && !editando) redirect('/portal')

  const { data: perfil } = await supabase
    .from('profiles')
    .select('full_name')
    .maybeSingle()

  const t = await getTranslations('onboarding')

  /*
   * El lugar guardado, con la forma que espera el buscador. `providerId` no se
   * guarda en `portals`, así que se fabrica uno reconocible: solo sirve para
   * distinguir «el lugar de siempre» de uno recién elegido.
   */
  const lugarInicial: Place | null =
    editando && portal?.birth_city && portal.lat !== null && portal.lng !== null && portal.tz
      ? {
          providerId: `guardado:${portal.lat},${portal.lng}`,
          city: portal.birth_city,
          region: null,
          country: portal.birth_country ?? '',
          countryCode: '',
          lat: Number(portal.lat),
          lng: Number(portal.lng),
          tz: portal.tz,
        }
      : null

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {editando ? t('editar.titulo') : t('titulo')}
        </h1>
        <p className="opacity-80">{editando ? t('editar.descripcion') : t('descripcion')}</p>
      </header>

      {editando ? (
        <p
          role="note"
          className="rounded-2xl border border-oro-claro bg-oro-palido/60 px-4 py-3 text-sm leading-relaxed"
        >
          {t.rich('editar.aviso', { b: (trozo) => <strong>{trozo}</strong> })}
        </p>
      ) : null}

      <FormularioNacimiento
        nombreInicial={portal?.full_name ?? perfil?.full_name ?? ''}
        editando={editando}
        valoresIniciales={
          editando && portal
            ? {
                birthDate: portal.birth_date ?? '',
                birthTime: portal.birth_time ? String(portal.birth_time).slice(0, 5) : '',
                timeUnknown: portal.time_unknown,
                lugar: lugarInicial,
                genero: generoParaLaVoz(portal.genero),
              }
            : undefined
        }
      />

      {editando ? (
        <Link href="/cuenta" className="text-center text-sm underline underline-offset-4">
          {t('editar.cancelar')}
        </Link>
      ) : null}
    </main>
  )
}

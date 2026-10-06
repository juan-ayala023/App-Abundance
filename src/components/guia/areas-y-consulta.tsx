'use client'

import { ChevronRight, Compass, DollarSign, GitBranch, Heart, Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { FormularioConsulta } from './formulario-consulta'

import { Tarjeta } from '@/components/layout/tarjeta'

/** Cada área, ya resuelta en el servidor: su nombre, dónde cae y qué preguntar. */
export type AreaParaElegir = {
  clave: string
  nombre: string
  /** «Casa 7 en ♐ Sagitario 12°». Vacío si no hay carta o no se pudo anclar. */
  ancla: string
  pregunta: string
}

const ICONOS: Record<string, LucideIcon> = {
  abundancia: DollarSign,
  decisiones: GitBranch,
  proposito: Compass,
  bloqueos: Lock,
  relaciones: Heart,
}

/**
 * Las cinco áreas y el campo de consulta, juntos y en ese orden.
 *
 * Estaban separados: las áreas al final del portal, enlazando a `/guia?area=…`.
 * El cliente pidió traerlas delante del campo (oct 2026), y al hacerlo apareció
 * un fallo que en el portal no se veía: **pulsar un área ya estando en la guía
 * no cambiaba nada**. Era la misma ruta con otro parámetro, y el router servía
 * lo que ya tenía; el campo se quedaba vacío y el enlace parecía roto.
 *
 * Se podía forzar la recarga. No se hace, porque la recarga era el problema:
 * elegir un área es una decisión de un toque, y pedirle al servidor una página
 * entera para rellenar un cuadro de texto es caro y se nota. Ahora la selección
 * vive aquí, en el navegador, y es instantánea.
 *
 * Las preguntas llegan ya resueltas desde el servidor y no se construyen aquí:
 * así el texto que acaba en el prompt del modelo sale del diccionario, nunca de
 * algo que el navegador pueda inventarse.
 */
export function AreasYConsulta({
  areas,
  restantes,
  inicial = null,
}: {
  areas: AreaParaElegir[]
  restantes: number
  /** El área que venía en la URL, para seguir honrando `/guia?area=…`. */
  inicial?: string | null
}) {
  const t = useTranslations('areas')
  const [elegida, setElegida] = useState<string | null>(inicial)

  const pregunta = areas.find((area) => area.clave === elegida)?.pregunta ?? ''

  return (
    <>
      <Tarjeta className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-light">{t('titulo')}</h2>
          <p className="text-sm text-tinta-suave">{t('subtitulo')}</p>
        </div>

        {/*
          Una columna en el teléfono. Cada área lleva dos líneas —el nombre y el
          lugar de la carta— y es algo que se pulsa: a dos columnas en 360 px,
          «Relaciones y vínculos» se parte en tres líneas y el área de toque
          queda por debajo de lo que un pulgar acierta con comodidad.
        */}
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => {
            const Icono = ICONOS[area.clave] ?? Compass
            const activa = area.clave === elegida

            return (
              <li key={area.clave}>
                <button
                  type="button"
                  onClick={() => setElegida(area.clave)}
                  aria-pressed={activa}
                  className={`flex h-full w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                    activa
                      ? 'border-oro bg-oro-palido/60'
                      : 'border-borde bg-fondo hover:bg-fondo-hondo'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full border border-oro-claro text-oro"
                  >
                    <Icono size={18} />
                  </span>

                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{area.nombre}</span>
                    {/*
                      Sin carta —o sin ancla resoluble— se queda solo el nombre.
                      No se rellena con un lugar inventado: en un producto cuyo
                      entregable es una interpretación personal, una casa que no
                      es la suya es peor que ninguna.
                    */}
                    {area.ancla ? (
                      <span className="text-xs text-tinta-suave">{area.ancla}</span>
                    ) : null}
                  </span>

                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="ml-auto shrink-0 text-tinta-tenue"
                  />
                </button>
              </li>
            )
          })}
        </ul>
      </Tarjeta>

      <Tarjeta className="flex flex-col gap-8">
        <p className="text-lg italic leading-relaxed text-tinta-suave">{t('intro')}</p>

        {/*
          `key` con el área: cambiarla vuelve a montar el formulario, y así el
          campo —que es controlado y guarda su propio borrador— arranca con la
          pregunta nueva. Sin esto, elegir una segunda área no cambiaría nada de
          lo escrito, que es justo el fallo que vinimos a arreglar.
        */}
        <FormularioConsulta
          key={elegida ?? 'sin-area'}
          restantes={restantes}
          preguntaInicial={pregunta}
        />
      </Tarjeta>
    </>
  )
}

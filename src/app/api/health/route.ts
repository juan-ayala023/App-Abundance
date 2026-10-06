import { NextResponse } from 'next/server'

/**
 * Qué versión está sirviendo el portal.
 *
 * El backend tiene esto desde el 3 de octubre de 2026 y se ganó el sitio en una
 * tarde: «¿ya está desplegado?» no se podía contestar desde fuera, y con el SHA
 * delante se contesta en un segundo. Aquí hacía más falta todavía —todo lo que
 * cambia en esta app vive detrás del login, así que desde la calle no se nota
 * ninguna diferencia entre la versión de ayer y la de hoy.
 *
 * No dice nada sensible: es el identificador de un commit de un repositorio
 * privado. No revela qué hay dentro ni dónde está.
 */
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({
    status: 'ok',
    commit: (process.env.RAILWAY_GIT_COMMIT_SHA || '').slice(0, 7) || null,
  })
}

import { expect, test } from '@playwright/test'

/**
 * El idioma puede llegar en la URL, y es la única forma de que llegue.
 *
 * La app guarda el idioma en una cookie de su propio dominio. Quien compra
 * entra desde otro —la web, o el enlace de un correo— así que llega sin
 * ninguna: Andrea compró en inglés, recibió el correo en inglés y el portal se
 * abrió en español (3 oct 2026). Ahora el enlace lleva `?lang=` y el portal lo
 * respeta desde la primera pantalla.
 */
test('entrar con ?lang=en deja la app en inglés', async ({ page }) => {
  await page.goto('/activar?lang=en')

  await expect(page.getByRole('heading', { name: /welcome to abundance code/i })).toBeVisible()

  // Y se queda: la elección sobrevive a navegar sin el parámetro.
  await page.goto('/activar')
  await expect(page.getByRole('heading', { name: /welcome to abundance code/i })).toBeVisible()
})

test('y con ?lang=es vuelve al español', async ({ page }) => {
  await page.goto('/activar?lang=en')
  await page.goto('/activar?lang=es')

  await expect(page.getByRole('heading', { name: /te damos la bienvenida/i })).toBeVisible()
})

test('un idioma inventado no cambia nada', async ({ page }) => {
  await page.goto('/activar?lang=klingon')

  await expect(page.getByRole('heading', { name: /te damos la bienvenida/i })).toBeVisible()
})

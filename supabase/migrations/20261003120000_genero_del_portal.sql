-- ---------------------------------------------------------------------------
-- portals.genero — a quién le está hablando la lectura.
--
-- Petición de Andrea (3 oct 2026). Hasta ahora la voz tenía prohibido decidir
-- el género: «escribe de forma que no haga falta elegirlo; cuando la gramática
-- lo exija, reformula». Era lo correcto sin el dato —en español, suponer deja
-- fuera a la mitad— pero obliga al texto a esquivar concordancias todo el
-- rato, y se nota: «te damos la bienvenida» donde cabría «bienvenida».
--
-- Preguntándolo, la lectura concuerda de verdad. Y quien no quiera decirlo
-- sigue recibiendo la versión neutra, que es la que ya existe y funciona.
--
-- Nulo a propósito: los portales creados antes de hoy no lo tienen, y eso no
-- es un dato que falte sino una lectura que se escribe sin género, como se ha
-- escrito siempre.
-- ---------------------------------------------------------------------------

alter table public.portals
  add column if not exists genero text;

alter table public.portals
  drop constraint if exists portals_genero_check;

alter table public.portals
  add constraint portals_genero_check
  check (genero is null or genero in ('femenino', 'masculino', 'sin-decir'));

comment on column public.portals.genero is
  'Cómo quiere que le hablen las lecturas. Null o «sin-decir» = voz neutra.';
